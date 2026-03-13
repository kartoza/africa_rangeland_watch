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
from layers.utils import upload_file

from .models import (
    TrendsEarthJob,
    TrendsEarthJobStatus,
    TrendsEarthJobType,
    TrendsEarthSetting,
)
from analysis.external.trendsearth import (
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

            for idx, entry in enumerate(cog_entries):
                _download_and_store_te_cog(
                    entry['url'],
                    job,
                    idx,
                    bands=entry.get('bands') or None,
                )

            job.status = TrendsEarthJobStatus.COMPLETED
            job.result = {
                'cog_urls': [e['url'] for e in cog_entries],
                'execution_id': job.execution_id,
            }
            job.completed_at = timezone.now()
            job.save()

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
        '-nodata', str(no_data) if no_data is not None else '',
        src_path,
        dst_path,
    ]
    cmd = [c for c in cmd if c]
    subprocess.run(cmd, check=True, capture_output=True)


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
    subprocess.run(cmd, check=True, capture_output=True)


def _get_cog_bounds(cog_path: str) -> dict:
    """Get bounds of a COG file."""
    import subprocess

    cmd = [
        'gdalinfo',
        '-json',
        cog_path,
    ]
    result = subprocess.run(cmd, check=True, capture_output=True)
    info = json.loads(result.stdout)

    transform = (
        info['geoLocation']['upperLeft'] +
        info['geoLocation']['lowerRight']
    )
    return {
        'west': transform[0],
        'south': transform[3],
        'east': transform[2],
        'north': transform[1],
    }


def _register_cog_layer(
    cog_path: str,
    layer_uuid: uuid.UUID,
    internal_name: str,
    display_name: str,
    job: TrendsEarthJob,
    add_to_map: bool = True,
) -> None:
    """Register a COG as an InputLayer."""
    bucket_name = getattr(settings, 'GCS_BUCKET_NAME', None)

    tile_url = upload_file(
        file_path=cog_path,
        file_name=f'{internal_name}.tif',
        bucket_name=bucket_name,
    )

    bounds = _get_cog_bounds(cog_path)

    te_provider, _ = DataProvider.objects.get_or_create(
        name='Trends.Earth'
    )
    te_group, _ = LayerGroupType.objects.get_or_create(
        name='trends-earth'
    )
    InputLayerFixture.objects.get_or_create(
        uuid=layer_uuid,
        defaults={
            'name': display_name,
            'layer_type': InputLayerType.RASTER,
            'data_provider': te_provider,
            'group': te_group,
            'url': tile_url,
            'created_by': job.user,
            'updated_by': job.user,
            'metadata': {'bounds': bounds},
        }
    )


def _download_and_store_te_cog(
    cog_url: str,
    job: TrendsEarthJob,
    cog_index: int,
    bands: typing.Optional[typing.List[dict]] = None,
) -> None:
    """
    Download a COG from Trends.Earth and register it for map rendering.
    """
    base_uuid_seed = f'te-cog-{job.pk}-{cog_index}'

    try:
        with tempfile.TemporaryDirectory() as work_dir:
            raw_filename = f'{base_uuid_seed}.tif'
            raw_path = os.path.join(work_dir, raw_filename)

            logger.info(
                'Downloading TE COG for job %s index %s from %s',
                job.pk, cog_index, cog_url,
            )
            with requests.get(cog_url, stream=True, timeout=120) as r:
                r.raise_for_status()
                with open(raw_path, 'wb') as fh:
                    shutil.copyfileobj(r.raw, fh)

            if bands:
                for band_idx, band in enumerate(bands):
                    band_number = band_idx + 1
                    band_name = band.get('name') or f'Band {band_number}'
                    band_meta = band.get('metadata') or {}
                    year = band_meta.get('year')
                    add_to_map = band.get('add_to_map', False)
                    no_data = band.get('no_data_value')

                    band_uuid = uuid.uuid5(
                        uuid.NAMESPACE_OID,
                        f'{base_uuid_seed}-band-{band_idx}',
                    )
                    display_name = band_name
                    if year:
                        display_name = f'{band_name} {year}'
                    internal_name = (
                        f'te_{job.job_type}_'
                        f'{job.pk}_{cog_index}_{band_idx}.tif'
                    )
                    band_path = os.path.join(
                        work_dir, f'{band_uuid}.tif'
                    )

                    _extract_single_band_cog(
                        raw_path, band_path, band_number, no_data
                    )

                    _register_cog_layer(
                        band_path,
                        band_uuid,
                        internal_name,
                        display_name,
                        job,
                        add_to_map=add_to_map,
                    )
            else:
                raster_uuid = uuid.uuid5(
                    uuid.NAMESPACE_OID, base_uuid_seed
                )
                internal_name = (
                    f'te_{job.job_type}_{job.pk}'
                    f'_{cog_index}.tif'
                )
                display_name = f'{job.task_name} {cog_index + 1}'
                reprojected_path = os.path.join(
                    work_dir, f'{raster_uuid}_3857.tif'
                )
                _reproject_to_3857(raw_path, reprojected_path)
                _register_cog_layer(
                    reprojected_path,
                    raster_uuid,
                    internal_name,
                    display_name,
                    job,
                )

    except Exception as exc:
        logger.error(
            'TE COG download failed for job %s index %s: %s',
            job.pk, cog_index, exc,
            exc_info=True,
        )
        raise
