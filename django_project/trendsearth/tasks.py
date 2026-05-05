# coding=utf-8
"""
Trends.Earth tasks for ARW.
"""
import json
import logging
import os
import shutil
import tempfile
import time
import typing
import uuid

import hashlib

import requests
from core.celery import app
from django.utils import timezone
from django.conf import settings

from layers.models import (
    InputLayer as InputLayerFixture,
    DataProvider,
    InputLayerType,
    LayerGroupType,
)
from cloud_native_gis.models.layer import Layer, LayerType
from cloud_native_gis.models.layer_upload import LayerUpload

from .models import (
    TrendsEarthJob,
    TrendsEarthJobStatus,
    TrendsEarthJobType,
    TrendsEarthSetting,
)
from .api import (
    TrendsEarthAuthError,
    TrendsEarthAPIError,
    refresh_access_token,
    get_execution_status,
    extract_result_bands,
    submit_ldn_job,
    submit_drought_job,
    submit_urbanization_job,
    submit_population_job,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# GEE upload helpers
# ---------------------------------------------------------------------------

def _job_hash(location_ids, params=None) -> str:
    """Return an 8-char hex hash that uniquely identifies a job's output.

    Combines sorted location IDs with any analysis parameters that affect
    the result (e.g. urbanization thresholds).  Different combinations of
    community + parameters produce distinct GEE image asset paths so that
    uploads never overwrite each other.
    """
    ids = sorted(int(i) for i in location_ids) if location_ids else []
    # Canonicalise params: sort keys so dict ordering doesn't matter.
    canonical_params = (
        sorted(params.items()) if params else []
    )
    payload = str((ids, canonical_params))
    return hashlib.sha1(payload.encode()).hexdigest()[:8]


def _gee_collection_id(job: 'TrendsEarthJob') -> str:
    """Return the shared GEE ImageCollection asset ID for a job type.

    One collection per job_type — all year ranges of the same indicator
    accumulate as yearly Images inside the same ImageCollection.
    Matches the canonical key used in the GEEAsset fixture.
    """
    prefix = getattr(settings, 'GEE_ASSET_ID_PREFIX', 'projects/ee-dng/assets/')
    return f'{prefix.rstrip("/")}/trendsearth/{job.job_type}'


def _ensure_gee_folder(folder_id: str) -> None:
    """Create a GEE Folder asset; silently ignores if it already exists."""
    import ee
    try:
        ee.data.createAsset({'type': 'Folder'}, folder_id)
        logger.info('Created GEE Folder: %s', folder_id)
    except ee.EEException as exc:
        msg = str(exc).lower()
        if 'already exists' in msg or 'cannot overwrite' in msg:
            logger.debug('GEE Folder already exists: %s', folder_id)
        else:
            logger.error('Failed to create GEE Folder %s: %s', folder_id, exc)
            raise


def _create_gee_collection(collection_id: str) -> None:
    """
    Create a GEE ImageCollection asset; silently ignores if it already exists.

    Ensures that every parent folder in the path exists before creating the
    ImageCollection, since GEE returns 404 when an intermediate folder is
    missing.
    """
    import ee

    # Ensure all intermediate folders exist.
    # e.g. 'projects/ee-dng/assets/trendsearth/ldn'
    #   → create 'projects/ee-dng/assets/trendsearth' first.
    parts = collection_id.split('/')
    # GEE asset paths start with 'projects/<project>/assets/...'
    # The root prefix is 'projects/<project>/assets' (index 0-2),
    # so we start creating folders from index 3 onward.
    root_depth = 3  # projects / <project> / assets
    for depth in range(root_depth + 1, len(parts)):
        folder_id = '/'.join(parts[:depth])
        _ensure_gee_folder(folder_id)

    try:
        ee.data.createAsset({'type': 'ImageCollection'}, collection_id)
        logger.info('Created GEE ImageCollection: %s', collection_id)
    except ee.EEException as exc:
        msg = str(exc).lower()
        if 'already exists' in msg or 'cannot overwrite' in msg:
            logger.info('GEE ImageCollection already exists: %s', collection_id)
        else:
            logger.error(
                'Failed to create GEE ImageCollection %s: %s',
                collection_id, exc
            )
            raise


def _upload_to_gcs(local_path: str, gcs_blob_path: str) -> str:
    """Upload a local file to GCS and return its gs:// URI."""
    from django.conf import settings
    from core.gcs import get_gcs_client
    bucket = get_gcs_client()
    blob = bucket.blob(gcs_blob_path)
    blob.upload_from_filename(local_path)
    uri = f'gs://{settings.GCS_BUCKET_NAME}/{gcs_blob_path}'
    logger.info('Uploaded %s → %s', local_path, uri)
    return uri


def _ingest_image_to_gee_collection(
    gcs_uri: str,
    image_asset_id: str,
    year: int,
    location_hash: str = '',
) -> str:
    """Start a GEE ingestion task to import a GCS COG as an Image.

    ``location_hash`` is stored as an Image property so that images from
    different communities for the same year can coexist in the collection.
    Returns the GEE task ID.
    """
    import ee
    manifest = {
        'name': image_asset_id,
        'tilesets': [{'sources': [{'uris': [gcs_uri]}]}],
        'startTime': f'{year}-01-01T00:00:00Z',
        'endTime': f'{year + 1}-01-01T00:00:00Z',
        'properties': {
            'year': year,
            'location_hash': location_hash,
        },
    }
    task_id = ee.data.newTaskId()[0]
    res = ee.data.startIngestion(task_id, manifest)
    ingestion_id = res.get('id', task_id)
    logger.info(
        'Started GEE ingestion for %s (year=%d, loc=%s): task=%s',
        image_asset_id, year, location_hash, ingestion_id,
    )
    return ingestion_id


@app.task(
    name='trendsearth_submit_job',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def submit_te_job(
    self,
    job_id: int,
    un_adju: bool = False,
    isi_thr: int = 30,
    ntl_thr: int = 10,
    wat_thr: int = 25,
    cap_ope: int = 200,
    pct_suburban: float = 0.25,
    pct_urban: float = 0.50,
):
    """
    Submit a Trends.Earth job based on job type.

    This task handles all four job types:
    LDN, Drought, Urbanization, and Population.
    """
    job = TrendsEarthJob.objects.get(id=job_id)

    try:
        te_setting = TrendsEarthSetting.objects.get(user=job.user)
    except TrendsEarthSetting.DoesNotExist:
        job.status = TrendsEarthJobStatus.FAILED
        job.error = {'message': 'Trends.Earth credentials not found'}
        job.save(update_fields=['status', 'error', 'updated_at'])
        return

    try:
        access_token, new_refresh = refresh_access_token(
            te_setting.refresh_token
        )
        if new_refresh != te_setting.refresh_token:
            te_setting.refresh_token = new_refresh
            te_setting.save(update_fields=['refresh_token', 'updated_at'])
    except TrendsEarthAuthError as exc:
        job.status = TrendsEarthJobStatus.FAILED
        job.error = {'message': f'Authentication failed: {exc}'}
        job.save(update_fields=['status', 'error', 'updated_at'])
        return
    except TrendsEarthAPIError as exc:
        logger.error('Error refreshing TE token for job %d: %s', job_id, exc)
        try:
            raise self.retry(exc=exc, countdown=60)
        except self.MaxRetriesExceededError:
            job.status = TrendsEarthJobStatus.FAILED
            job.error = {'message': f'Token refresh failed: {exc}'}
            job.save(update_fields=['status', 'error', 'updated_at'])
            return

    job.status = TrendsEarthJobStatus.RUNNING
    job.save(update_fields=['status', 'updated_at'])

    geojson_geom = job.geojson
    year_initial = job.year_initial
    year_final = job.year_final

    try:
        if job.job_type == TrendsEarthJobType.LDN:
            execution_id = submit_ldn_job(
                access_token=access_token,
                geojson_geom=geojson_geom,
                year_initial=year_initial,
                year_final=year_final,
            )
        elif job.job_type == TrendsEarthJobType.DROUGHT:
            execution_id = submit_drought_job(
                access_token=access_token,
                geojson_geom=geojson_geom,
                year_initial=year_initial,
                year_final=year_final,
            )
        elif job.job_type == TrendsEarthJobType.URBANIZATION:
            execution_id = submit_urbanization_job(
                access_token=access_token,
                geojson_geom=geojson_geom,
                un_adju=un_adju,
                isi_thr=isi_thr,
                ntl_thr=ntl_thr,
                wat_thr=wat_thr,
                cap_ope=cap_ope,
                pct_suburban=pct_suburban,
                pct_urban=pct_urban,
            )
        elif job.job_type == TrendsEarthJobType.POPULATION:
            execution_id = submit_population_job(
                access_token=access_token,
                geojson_geom=geojson_geom,
                year_initial=year_initial,
                year_final=year_final,
            )
        else:
            raise ValueError(f'Unknown job type: {job.job_type}')

        job.execution_id = execution_id
        job.save(update_fields=['execution_id', 'updated_at'])

        poll_te_job_status.delay(job_id)

    except (TrendsEarthAuthError, TrendsEarthAPIError) as exc:
        logger.error('Error submitting TE job %d: %s', job_id, exc)
        job.status = TrendsEarthJobStatus.FAILED
        job.error = {'message': f'Job submission failed: {exc}'}
        job.save(update_fields=['status', 'error', 'updated_at'])


@app.task(
    name='trendsearth_poll_job_status',
    bind=True,
    max_retries=60,
    default_retry_delay=120,
)
def poll_te_job_status(self, job_id: int):
    """
    Poll the Trends.Earth API for job completion and, on success,
    download and store each COG output.
    """
    job = TrendsEarthJob.objects.get(id=job_id)

    latest_non_terminal = (
        TrendsEarthJob.objects
        .filter(
            user=job.user,
            job_type=job.job_type,
            status__in=[
                TrendsEarthJobStatus.PENDING,
                TrendsEarthJobStatus.RUNNING,
            ]
        )
        .order_by('-id')
        .values_list('id', flat=True)
        .first()
    )

    if latest_non_terminal is None:
        # No non-terminal jobs exist — this job already reached a terminal
        # state (COMPLETED / FAILED / CANCELLED). Nothing left to poll.
        return

    if latest_non_terminal != job.id:
        TrendsEarthJob.objects.filter(
            id=job.id,
            status__in=[
                TrendsEarthJobStatus.PENDING,
                TrendsEarthJobStatus.RUNNING,
            ]
        ).update(status=TrendsEarthJobStatus.CANCELLED)
        logger.info(
            'Job %d superseded by job %d; marked CANCELLED.',
            job.id, latest_non_terminal
        )
        return

    if not job.execution_id:
        logger.error(
            'poll_te_job_status called for job %d '
            'but execution_id is not set.',
            job_id
        )
        return

    try:
        te_setting = TrendsEarthSetting.objects.get(user=job.user)
        access_token, new_refresh = refresh_access_token(
            te_setting.refresh_token
        )
        if new_refresh != te_setting.refresh_token:
            te_setting.refresh_token = new_refresh
            te_setting.save(update_fields=['refresh_token', 'updated_at'])

        exec_data = get_execution_status(
            access_token,
            job.execution_id
        )
        raw_status = (
            exec_data.get('data', exec_data).get('status', '')
            .upper()
        )

        if raw_status in ('FINISHED', 'COMPLETED', 'SUCCESS'):
            cog_entries = extract_result_bands(exec_data)
            if not cog_entries:
                logger.warning(
                    'TE job %s completed but returned no COG URLs.',
                    job.execution_id
                )

            # Initialise GEE, create the ImageCollection, then register
            # the GEEAsset + ONE InputLayer for the entire collection.
            from analysis.analysis import initialize_engine_analysis
            initialize_engine_analysis()
            gee_collection_id = _gee_collection_id(job)
            _create_gee_collection(gee_collection_id)
            _register_gee_collection_as_input_layer(job, gee_collection_id)

            try:
                for idx, entry in enumerate(cog_entries):
                    _download_and_store_te_cog(
                        entry['url'],
                        job,
                        idx,
                        gee_collection_id,
                        bands=entry.get('bands') or None,
                    )

                job.status = TrendsEarthJobStatus.COMPLETED
                job.result = {
                    'cog_urls': [e['url'] for e in cog_entries],
                    'execution_id': job.execution_id,
                    'gee_collection_id': gee_collection_id,
                }
                job.completed_at = timezone.now()
                job.save()
            except Exception as exc:
                logger.error(
                    'Failed to process COGs for job %d: %s',
                    job_id, exc,
                    exc_info=True,
                )
                job.status = TrendsEarthJobStatus.FAILED
                job.error = {'message': str(exc)}
                job.completed_at = timezone.now()
                job.save()
                return

        elif raw_status in ('FAILED', 'ERROR', 'CANCELLED'):
            error_msg = (
                exec_data.get('data', exec_data).get('error', raw_status)
            )
            job.status = TrendsEarthJobStatus.FAILED
            job.error = {'message': f'Trends.Earth job failed: {error_msg}'}
            job.completed_at = timezone.now()
            job.save()

        else:
            logger.info(
                'TE job %s status=%s; will poll again.',
                job.execution_id, raw_status
            )
            time.sleep(0.1)
            raise self.retry(countdown=120)

    except (TrendsEarthAuthError, TrendsEarthAPIError) as exc:
        logger.error(
            'Error polling TE job for job %d: %s',
            job_id, exc
        )
        try:
            time.sleep(0.1)
            raise self.retry(exc=exc, countdown=120)
        except self.MaxRetriesExceededError:
            job.status = TrendsEarthJobStatus.FAILED
            job.error = {'message': str(exc)}
            job.completed_at = timezone.now()
            job.save()


def _extract_single_band_cog(
    src_path: str,
    dst_path: str,
    band_number: int,
    no_data: typing.Optional[int] = None,
) -> None:
    """Extract a single band from a multi-band COG."""
    import subprocess

    cmd = [
        'gdal_translate',
        '-b', str(band_number),
        '-of', 'COG',
    ]
    if no_data is not None:
        cmd.extend(['-a_nodata', str(no_data)])
    cmd.extend([src_path, dst_path])

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        logger.error(
            'gdal_translate failed on %s: %s',
            src_path,
            result.stderr.decode(),
        )
        raise subprocess.CalledProcessError(
            result.returncode, cmd, result.stdout, result.stderr
        )


def _reproject_to_3857(src_path: str, dst_path: str) -> None:
    """Reproject a COG to EPSG:3857."""
    import subprocess

    cmd = [
        'gdalwarp',
        '-t_srs', 'EPSG:3857',
        '-of', 'COG',
        src_path,
        dst_path,
    ]

    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        logger.error(
            'gdalwarp failed on %s: %s',
            src_path,
            result.stderr.decode(),
        )
        raise subprocess.CalledProcessError(
            result.returncode, cmd, result.stdout, result.stderr
        )


def _get_cog_bounds(cog_path: str) -> dict:
    """Get bounds of a COG file using gdalinfo.

    Handles multiple gdalinfo output formats for bounds:
    - cornerCoordinates (most common)
    - geoLocation
    - wgs84BoundingBox
    """
    import subprocess

    cmd = [
        'gdalinfo',
        '-json',
        cog_path,
    ]
    result = subprocess.run(cmd, check=True, capture_output=True)
    info = json.loads(result.stdout)

    # Try cornerCoordinates first (most common format)
    if 'cornerCoordinates' in info:
        coords = info['cornerCoordinates']
        if 'upperLeft' in coords and 'lowerRight' in coords:
            return {
                'west': coords['upperLeft'][0],
                'south': coords['lowerRight'][1],
                'east': coords['lowerRight'][0],
                'north': coords['upperLeft'][1],
            }

    # Try geoLocation format
    if 'geoLocation' in info:
        geo = info['geoLocation']
        if 'upperLeft' in geo and 'lowerRight' in geo:
            return {
                'west': geo['upperLeft'][0],
                'south': geo['lowerRight'][1],
                'east': geo['lowerRight'][0],
                'north': geo['upperLeft'][1],
            }

    # Try wgs84BoundingBox format
    if 'wgs84BoundingBox' in info:
        bbox = info['wgs84BoundingBox']
        if len(bbox) >= 2:
            return {
                'west': bbox[0][0],
                'south': bbox[0][1],
                'east': bbox[1][0],
                'north': bbox[1][1],
            }

    # Log the actual output for debugging
    logger.warning(
        'Could not extract bounds from gdalinfo output for %s: %s',
        cog_path,
        result.stdout.decode()[:500],
    )
    raise ValueError(
        f'Could not extract bounds from gdalinfo output for {cog_path}'
    )


def _register_gee_collection_as_input_layer(
    job: TrendsEarthJob,
    collection_id: str,
) -> None:
    """Create a ``GEEAsset`` record and a single ``InputLayer`` for a
    Trends.Earth GEE ImageCollection.

    Called once per job after the ImageCollection is created in GEE.
    The ``InputLayer.url`` stores the GEE asset path so layer generators
    can call ``GEEAsset.fetch_asset_source(key)`` and build tile URLs
    on demand (same pattern as MODIS / CGLS generators).
    """
    from analysis.models import GEEAsset, GEEAssetType

    # --- GEEAsset ---------------------------------------------------------
    # One key per job_type — matches the fixture key (no year range).
    gee_key = f'trendsearth_{job.job_type}'

    GEEAsset.objects.get_or_create(
        key=gee_key,
        defaults={
            'source': collection_id,
            'type': GEEAssetType.IMAGE_COLLECTION,
            'metadata': {},
        },
    )

    # --- InputLayer -------------------------------------------------------
    # Look up the canonical InputLayer by name + group so it matches the
    # fixture record (avoids duplicate records across different year-range jobs).
    te_provider, _ = DataProvider.objects.get_or_create(name='Trends.Earth')
    te_group, _ = LayerGroupType.objects.get_or_create(name='trends-earth')
    display_name = job.get_job_type_display()

    InputLayerFixture.objects.get_or_create(
        name=display_name,
        group=te_group,
        data_provider=te_provider,
        defaults={
            'layer_type': InputLayerType.RASTER,
            'url': collection_id,
            'created_by': job.user,
            'updated_by': job.user,
            'metadata': {
                'gee_collection_id': collection_id,
                'gee_key': gee_key,
            },
        }
    )

    logger.info(
        'Registered GEEAsset "%s" and InputLayer "%s".',
        gee_key, display_name,
    )


def _register_cog_layer(
    cog_path: str,
    layer_uuid: uuid.UUID,
    internal_name: str,
    job: TrendsEarthJob,
) -> None:
    """Store a single-band COG in cloud_native_gis for internal use.

    Creates a ``cloud_native_gis.Layer`` + ``LayerUpload`` so the file is
    persisted on the server.  Does *not* create an ``InputLayer`` — the
    single ``InputLayer`` for the entire ImageCollection is created once
    by ``_register_gee_collection_as_input_layer``.
    """
    tif_filename = f'{layer_uuid}.tif'

    layer, _ = Layer.objects.get_or_create(
        unique_id=str(layer_uuid),
        layer_type=LayerType.RASTER_TILE,
        defaults={
            'name': internal_name,
            'created_by': job.user,
        }
    )

    layer_upload, _ = LayerUpload.objects.get_or_create(
        layer=layer,
        defaults={'created_by': job.user}
    )
    layer_upload.emptying_folder()
    shutil.copy(cog_path, layer_upload.filepath(tif_filename))
    layer_upload.save()

    layer.refresh_from_db()
    layer.is_ready = True
    layer.save()


def _download_and_store_te_cog(
    cog_url: str,
    job: TrendsEarthJob,
    cog_index: int,
    gee_collection_id: str,
    bands: typing.Optional[typing.List[dict]] = None,
) -> None:
    """Download a COG from Trends.Earth and upload each year-band to GEE.

    For each band that carries a ``year`` in its metadata:
    - Extract it as a single-band COG
    - Store the COG in cloud_native_gis (internal backup)
    - Upload to GCS and ingest into *gee_collection_id* as a GEE Image

    The single ``InputLayer`` / ``GEEAsset`` representing the whole
    ImageCollection is created separately by
    ``_register_gee_collection_as_input_layer``; this function does NOT
    create per-band InputLayers.
    """
    base_uuid_seed = f'te-cog-{job.pk}-{cog_index}'

    try:
        with tempfile.TemporaryDirectory() as work_dir:
            raw_path = os.path.join(work_dir, f'{base_uuid_seed}.tif')

            logger.info(
                'Downloading TE COG for job %d index %d from %s',
                job.pk, cog_index, cog_url,
            )
            with requests.get(cog_url, stream=True, timeout=120) as r:
                r.raise_for_status()
                with open(raw_path, 'wb') as fh:
                    shutil.copyfileobj(r.raw, fh)

            file_size = os.path.getsize(raw_path)
            if file_size == 0:
                raise ValueError(
                    f'Downloaded file for job {job.pk} cog index '
                    f'{cog_index} is empty (0 bytes)'
                )
            logger.info(
                'Downloaded TE COG for job %d index %d: %d bytes',
                job.pk, cog_index, file_size,
            )

            if bands:
                loc_hash = _job_hash(job.location_ids, job.params)
                for band_idx, band in enumerate(bands):
                    band_number = band_idx + 1
                    band_meta = band.get('metadata') or {}
                    year = band_meta.get('year')
                    no_data = band.get('no_data_value')

                    band_uuid = uuid.uuid5(
                        uuid.NAMESPACE_OID,
                        f'{base_uuid_seed}-band-{band_idx}',
                    )
                    internal_name = (
                        f'te_{job.job_type}_'
                        f'{job.pk}_{cog_index}_{band_idx}.tif'
                    )
                    band_path = os.path.join(work_dir, f'{band_uuid}.tif')

                    _extract_single_band_cog(
                        raw_path, band_path, band_number, no_data
                    )
                    _register_cog_layer(band_path, band_uuid, internal_name, job)

                    if year:
                        try:
                            gcs_uri = _upload_to_gcs(
                                band_path,
                                f'trendsearth/{job.pk}/{band_uuid}.tif',
                            )
                            # Image asset ID includes the location hash so
                            # different communities for the same year coexist
                            # in the collection instead of overwriting each
                            # other.  The analysis mosaics them at query time.
                            image_asset_id = (
                                f'{gee_collection_id}/y{year}_{loc_hash}'
                            )
                            _ingest_image_to_gee_collection(
                                gcs_uri,
                                image_asset_id,
                                int(year),
                                location_hash=loc_hash,
                            )
                        except Exception as exc:
                            logger.warning(
                                'GEE upload failed for job %d band %d '
                                '(year=%s): %s',
                                job.pk, band_idx, year, exc,
                            )
            else:
                raster_uuid = uuid.uuid5(uuid.NAMESPACE_OID, base_uuid_seed)
                internal_name = (
                    f'te_{job.job_type}_{job.pk}_{cog_index}.tif'
                )
                reprojected_path = os.path.join(
                    work_dir, f'{raster_uuid}_3857.tif'
                )
                _reproject_to_3857(raw_path, reprojected_path)
                _register_cog_layer(
                    reprojected_path, raster_uuid, internal_name, job
                )

    except Exception as exc:
        logger.error(
            'TE COG download failed for job %d index %d: %s',
            job.pk, cog_index, exc,
            exc_info=True,
        )
        raise
