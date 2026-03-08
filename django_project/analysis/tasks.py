# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background task for analysis
"""
import typing
import os
import requests
import uuid
from core.celery import app
import ee
import logging
import tempfile
import shutil
import time
import subprocess
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse

from cloud_native_gis.models.layer import Layer, LayerType
from cloud_native_gis.models.layer_upload import LayerUpload
from core.models import TaskStatus, Preferences
from analysis.models import (
    AnalysisResultsCache,
    AnalysisRasterOutput,
    AnalysisTask,
    AnalysisTaskType,
    Indicator,
    TrendsEarthSetting,
    UserIndicator,
    UserGEEAsset,
    UserAnalysisResults,
    IndicatorSource
)
from analysis.analysis import (
    export_image_to_drive,
    initialize_engine_analysis, InputLayer,
    get_rel_diff, calculate_temporal_modis_veg,
    spatial_get_date_filter
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
from analysis.external.user_raster import _build_aggregated_images
from analysis.external.gpw import _build_gpw_annual_images
from analysis.runner import AnalysisRunner
from analysis.utils import (
    get_gdrive_file,
    delete_gdrive_file,
    get_cog_bounds,
    get_date_range_for_analysis
)
from layers.models import (
    InputLayer as InputLayerFixture,
    DataProvider,
    InputLayerType,
    LayerGroupType,
)
from layers.utils import upload_file

logger = logging.getLogger(__name__)
User = get_user_model()


def _get_indicator(raster_output: AnalysisRasterOutput):
    user_analysis_result = UserAnalysisResults.objects.filter(
        raster_outputs=raster_output
    ).first()

    if not user_analysis_result:
        raise ValueError("No User Analysis Result found!")

    analysis_task: AnalysisTask = AnalysisTask.objects.filter(
        analysis_inputs=user_analysis_result.analysis_results['data']
    ).first()
    if not analysis_task:
        raise ValueError("No Analysis Task found!")
    indicator = analysis_task.get_indicator()
    return indicator


def _run_spatial_analysis(
    analysis_raster_output: AnalysisRasterOutput,
    indicator: typing.Union[UserIndicator, Indicator]
):
    """Run spatial analysis to get difference of relative layer."""
    data = analysis_raster_output.analysis
    input_layers = InputLayer()
    reference_layer_geom = AnalysisRunner.get_reference_layer_geom(data)
    (
        spatial_analysis_dict,
        temporal_analysis_dict
    ) = AnalysisRunner.get_analysis_dict_spatial(data)
    filter_start_date, filter_end_date = spatial_get_date_filter(
        spatial_analysis_dict
    )

    user_analysis_result = UserAnalysisResults.objects.filter(
        raster_outputs=analysis_raster_output
    ).first()

    analysis_task: AnalysisTask = AnalysisTask.objects.filter(
        analysis_inputs=user_analysis_result.analysis_results['data']
    ).first()
    indicator = analysis_task.get_indicator()

    rel_diff = get_rel_diff(
        input_layers.get_spatial_layer_dict(
            filter_start_date, filter_end_date
        ),
        spatial_analysis_dict,
        reference_layer_geom,
        indicator.get_reducer()
    )
    return rel_diff


def _get_bounds(raster_output):
    """Get bounds from a selected community by locations."""
    # get aoi
    input_layers = InputLayer()
    selected_geos = input_layers.get_selected_geos()
    communities = input_layers.get_communities()

    locations = raster_output.analysis.get('locations')
    features_geo = []
    for location in locations:
        geo = ee.Geometry.Point(
            [location.get('lon'), location.get('lat')]
        )
        features_geo.append(ee.Feature(geo))
    selected_geos = selected_geos.merge(
        ee.FeatureCollection(features_geo)
    )

    return communities.filterBounds(selected_geos)


@app.task(name='store_spatial_analysis_raster_output')
def store_spatial_analysis_raster_output(raster_output_id: int):
    """Trigger task to store analysis raster output."""
    raster_output = AnalysisRasterOutput.objects.get(uuid=raster_output_id)
    # clear existing raster if exist in gdrive
    delete_gdrive_file(raster_output.raster_filename)
    raster_output.status = 'RUNNING'
    raster_output.generate_start_time = timezone.now()
    raster_output.save()

    initialize_engine_analysis()

    indicator = _get_indicator(raster_output)
    aoi = _get_bounds(raster_output)
    if isinstance(indicator, UserIndicator) or\
        indicator.source == IndicatorSource.GPW:
        metadata = indicator.metadata
        vis_params = {
            'min': metadata['minValue'],
            'max': metadata['maxValue'],
            'palette': metadata['colors'],
            'opacity': metadata['opacity']
        }
    else:
        vis_params = {
            'min': -25,
            'max': 25,
            'palette': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
            'opacity': 0.7
        }
    image = _run_spatial_analysis(raster_output, indicator)

    status = export_image_to_drive(
        image=image,
        description=raster_output.name,
        folder='GEE_EXPORTS',
        file_name_prefix=str(raster_output.uuid),
        scale=120,  # same with temporal calc result
        region=aoi.geometry(),
        vis_params=vis_params
    )

    final_status = status['state']
    size = 0
    if final_status == 'COMPLETED':
        # check exist and get size
        gdrive_file = get_gdrive_file(raster_output.raster_filename)
        if gdrive_file is None:
            final_status = 'FAILED'
            status['gdrive_error'] = (
                f'File {raster_output.raster_filename} not found!'
            )
        else:
            gdrive_file.FetchMetadata()
            size = gdrive_file.get("fileSize", 0)
            store_cog_as_layer(
                raster_output.uuid,
                raster_output.name,
                gdrive_file,
                metadata=vis_params
            )

    raster_output.status = final_status
    raster_output.size = size
    raster_output.generate_end_time = timezone.now()
    raster_output.status_logs = status
    raster_output.save()


def fix_no_data_value(working_dir, file_name):
    """Fix no data value in the raster file."""
    tmp_path = os.path.join(
        working_dir,
        f'{time.time()}_{file_name}'
    )
    file_path = os.path.join(working_dir, file_name)
    # rename the file to tmp_path
    shutil.move(file_path, tmp_path)
    # use gdal to fix no data value
    cmd = [
        'gdal_translate',
        '-of',
        'COG',
        '-a_nodata',
        '-9999',
        tmp_path,
        file_path
    ]
    subprocess.run(cmd, check=True)


def store_cog_as_layer(uuid, name, gdrive_file, metadata={}):
    """Store cog file as a layer."""
    layer, _ = Layer.objects.get_or_create(
        unique_id=uuid,
        layer_type=LayerType.RASTER_TILE,
        defaults={
            'name': name,
            'created_by': User.objects.filter(
                is_superuser=True
            ).first()
        }
    )
    bounds = None
    with tempfile.TemporaryDirectory() as working_dir:
        file_path = f'{working_dir}/{gdrive_file["title"]}'
        gdrive_file.GetContentFile(file_path)

        # fix no data value
        fix_no_data_value(working_dir, gdrive_file["title"])
        # get bounds
        bounds = get_cog_bounds(file_path)

        is_success = False
        if settings.DEBUG:
            layer_upload, _ = LayerUpload.objects.get_or_create(
                layer=layer,
                defaults={
                    'created_by': layer.created_by
                }
            )
            layer_upload.emptying_folder()
            # copy file to media folder for local testing
            shutil.copy(
                file_path,
                layer_upload.filepath(gdrive_file["title"])
            )
            is_success = True
        else:
            # upload to cloud native gis API
            preferences = Preferences.load()
            base_url = settings.DJANGO_BACKEND_URL
            if base_url.endswith('/'):
                base_url = base_url[:-1]
            auth = f'Token {preferences.worker_layer_api_key}'

            # upload to API
            upload_path = (
                base_url +
                f'/api/layer/{layer.id}/layer-upload/'
            )
            is_success = upload_file(
                upload_path,
                file_path,
                auth_header=auth
            )

        if not is_success:
            layer.delete()
            raise RuntimeError(
                f'Upload cog file for {uuid} failed!'
            )

        # update layer is ready
        layer.refresh_from_db()
        layer.is_ready = True
        metadata['bounds'] = bounds
        layer.metadata = metadata
        layer.save()

        # delete gdrive file after download
        gdrive_file.Delete()


@app.task(name='generate_temporal_analysis_raster_output')
def generate_temporal_analysis_raster_output(raster_output_id):
    """Trigger task to generate temporal analysis raster output."""
    raster_output = AnalysisRasterOutput.objects.get(uuid=raster_output_id)
    # clear existing raster if exist in gdrive
    delete_gdrive_file(raster_output.raster_filename)
    temporal_resolution = raster_output.analysis.get('temporalResolution')
    raster_output.status = 'RUNNING'
    raster_output.generate_start_time = timezone.now()
    raster_output.save()

    initialize_engine_analysis()

    # get date filter
    date_range_result = get_date_range_for_analysis(
        temporal_resolution,
        raster_output.analysis.get('year'),
        raster_output.analysis.get('quarter'),
        raster_output.analysis.get('month')
    )
    start_date = date_range_result['start_date']
    end_date = date_range_result['end_date']
    resolution = date_range_result['resolution']
    resolution_step = date_range_result['resolution_step']
    month_filter = date_range_result['month_filter']

    logger.info(
        f'Generating img {resolution} ({resolution_step}) '
        f'from {start_date} to {end_date}'
    )
    # get aoi
    aoi = _get_bounds(raster_output)
    input_layer = InputLayer()
    selected_area = input_layer.get_selected_area(aoi, False)

    # find input layer for get the vis param config
    input_layer_fixture = InputLayerFixture.objects.get(
        name=raster_output.analysis.get('variable')
    )

    indicator = _get_indicator(raster_output)

    # generate the image
    if isinstance(indicator, UserIndicator):
        img_col, var_name, _ = _build_aggregated_images(
            indicator.variable_name,
            indicator.created_by,
            start_date,
            [end_date],
            resolution
        )
        img = img_col.reduce(indicator.get_reducer())
    elif indicator.source == IndicatorSource.GPW:
        # Since 1 GPW raster represents 1 year,
        # date_ranges must have length of 1
        (
            img_col,
            var_name,
            indicator,
            date_ranges,
            dates
        ) = _build_gpw_annual_images(
            indicator.variable_name, start_date, [end_date.year]
        )
        year_start, year_end = date_ranges[0]
        test_dt = (year_end + relativedelta(months=1)).isoformat()

        subset = img_col.filterDate(year_start.isoformat(), test_dt)
        img = subset.reduce(indicator.get_reducer())
    else:
        img = calculate_temporal_modis_veg(
            selected_area, start_date.isoformat(), end_date.isoformat(),
            resolution, resolution_step,
            raster_output.analysis.get('variable')
        )
    if temporal_resolution == 'Annual':
        img = img.filter(
            ee.Filter.eq('year', raster_output.analysis.get('year'))
        ).first()
    else:
        img = img.filter(
            ee.Filter.And(
                ee.Filter.eq('year', raster_output.analysis.get('year')),
                ee.Filter.eq('month', month_filter)
            )
        ).first()

    status = export_image_to_drive(
        image=img,
        description=raster_output.name,
        folder='GEE_EXPORTS',
        file_name_prefix=str(raster_output.uuid),
        scale=120,  # same with temporal calc result
        region=aoi.geometry(),
        vis_params=input_layer_fixture.get_vis_params()
    )

    final_status = status['state']
    size = 0
    if final_status == 'COMPLETED':
        # check exist and get size
        gdrive_file = get_gdrive_file(raster_output.raster_filename)
        if gdrive_file is None:
            final_status = 'FAILED'
            status['gdrive_error'] = (
                f'File {raster_output.raster_filename} not found!'
            )
        else:
            gdrive_file.FetchMetadata()
            size = gdrive_file.get("fileSize", 0)
            store_cog_as_layer(
                raster_output.uuid,
                raster_output.name,
                gdrive_file,
                metadata=input_layer_fixture.get_vis_params()
            )

    raster_output.status = final_status
    raster_output.size = size
    raster_output.generate_end_time = timezone.now()
    raster_output.status_logs = status
    raster_output.save()


@app.task(name='clear_analysis_results_cache', ignore_result=True)
def clear_analysis_results_cache():
    """Trigger task to generate layers using GEE."""
    AnalysisResultsCache.objects.filter(
        expired_at__lt=timezone.now()
    ).delete()


@app.task(name='run_analysis_task')
def run_analysis_task(analysis_task_id: int):
    """Trigger task to run analysis task."""
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)
    analysis_task.status = TaskStatus.RUNNING
    analysis_task.updated_at = timezone.now()
    analysis_task.error = None
    analysis_task.result = None
    analysis_task.completed_at = None
    analysis_task.save()

    try:
        runner = AnalysisRunner(analysis_task=analysis_task)
        results = runner.run(analysis_task.analysis_inputs)
        analysis_task.result = results
        analysis_task.status = TaskStatus.COMPLETED
    except Exception as e:
        analysis_task.status = TaskStatus.FAILED
        analysis_task.error = {
            'message': str(e)
        }
        logger.error(
            f'Error running analysis task {analysis_task_id}: {e}',
            exc_info=True
        )
    finally:
        analysis_task.completed_at = timezone.now()
        analysis_task.updated_at = timezone.now()
        analysis_task.save()


@app.task(name='check_ingestor_asset_status')
def check_ingestor_asset_status(user_gee_asset_id: int):
    """Check ingestor asset status."""
    gee_asset = UserGEEAsset.objects.filter(
        id=user_gee_asset_id
    ).first()
    if not gee_asset:
        logger.error(
            f'UserGEEAsset with id {user_gee_asset_id} not found.'
        )
        return

    if not gee_asset.ingestion_status:
        logger.error(
            f'UserGEEAsset with id {user_gee_asset_id} '
            'has no ingestion status.'
        )
        return

    task_ids = gee_asset.get_running_ingestion_task_id()
    if not task_ids:
        UserIndicator.set_status_by_asset_key(gee_asset.key, True)
        return

    max_wait_time = 3600
    start_time = time.time()
    # Check the status of the GEE ingestion task
    initialize_engine_analysis()
    status_list = ee.data.getTaskStatus(task_ids)

    while (
        (time.time() - start_time) < max_wait_time
    ):
        for status in status_list:
            ingestion_status_dict = gee_asset.ingestion_status.get(
                status['id']
            )
            if ingestion_status_dict:
                ingestion_status_dict['status'] = status['state']
                ingestion_status_dict['error'] = status.get('error_message')
                gee_asset.ingestion_status[status['id']] = (
                    ingestion_status_dict
                )
        gee_asset.save()
        task_ids = gee_asset.get_running_ingestion_task_id()
        if not task_ids:
            break  # all tasks are completed
        time.sleep(60)
        status_list = ee.data.getTaskStatus(task_ids)

    # count stats
    completed_count = 0
    failed_count = 0
    for _, status in gee_asset.ingestion_status.items():
        if status['status'] == 'COMPLETED':
            completed_count += 1
        elif status['status'] == 'FAILED':
            failed_count += 1

    logger.info(
        f'GEE task {user_gee_asset_id} completed with '
        f'{completed_count} and failed with {failed_count}.'
    )

    # update the indicator status if it's completed or failed
    if failed_count > 0 or len(gee_asset.ingestion_status) != completed_count:
        UserIndicator.set_status_by_asset_key(gee_asset.key, False)
    else:
        UserIndicator.set_status_by_asset_key(gee_asset.key, True)


# ---------------------------------------------------------------------------
# Trends.Earth LDN tasks
# ---------------------------------------------------------------------------

def _build_te_layer_name(
    analysis_task: AnalysisTask,
    cog_index: int,
) -> str:
    """
    Build a human-readable display name for a Trends.Earth raster layer.

    Examples:
      "LDN 2015–2019 (band 1)"
      "Drought 2020–2022 (band 2)"
      "Population 2020"
    """
    type_label = {
        AnalysisTaskType.LDN: 'LDN',
        AnalysisTaskType.DROUGHT: 'Drought',
        AnalysisTaskType.URBANIZATION: 'Urbanization',
        AnalysisTaskType.POPULATION: 'Population',
    }.get(analysis_task.task_type, analysis_task.task_type.upper())

    inputs = analysis_task.analysis_inputs or {}
    year_start = inputs.get('year_initial')
    year_end = inputs.get('year_final')
    year = inputs.get('year')

    if year_start and year_end:
        period = f'{year_start}\u2013{year_end}'
    elif year:
        period = str(year)
    else:
        period = ''

    suffix = f' (band {cog_index + 1})' if cog_index > 0 else ''
    parts = [p for p in [type_label, period] if p]
    return ' '.join(parts) + suffix


def _extract_single_band_cog(
    src_path: str,
    dest_path: str,
    band_number: int,
    no_data_value: typing.Optional[float] = None,
) -> None:
    """Extract band N from src as a single-band EPSG:3857 COG."""
    nodata = str(no_data_value) if no_data_value is not None else '-9999'
    # gdal_translate into a VRT first because gdalwarp -b is only
    # available from GDAL 3.7 onward.
    vrt_path = dest_path + '.vrt'
    subprocess.run(
        [
            'gdal_translate',
            '-b', str(band_number),
            '-of', 'VRT',
            '-a_nodata', nodata,
            src_path,
            vrt_path,
        ],
        check=True,
    )
    subprocess.run(
        [
            'gdalwarp',
            '-t_srs', 'EPSG:3857',
            '-of', 'COG',
            '-co', 'BLOCKSIZE=256',
            '-co', 'TILING_SCHEME=GoogleMapsCompatible',
            '-co', 'COMPRESS=DEFLATE',
            '-co', 'OVERVIEWS=IGNORE_EXISTING',
            '-co', 'OVERVIEW_RESAMPLING=NEAREST',
            '-dstnodata', nodata,
            vrt_path,
            dest_path,
        ],
        check=True,
    )


def _register_cog_layer(
    file_path: str,
    layer_uuid,
    internal_name: str,
    display_name: str,
    analysis_task: AnalysisTask,
    add_to_map: bool = True,
) -> None:
    """
    Persist a single-band COG and register it in the DB.

    Creates a ``cloud_native_gis.Layer`` + ``LayerUpload`` so the file is
    served by the ``serve-cog`` endpoint.  When ``add_to_map=True`` also
    creates a ``layers.InputLayer`` in the 'trends-earth' group.

    Idempotent: safe to call on Celery retry.
    """
    bounds = get_cog_bounds(file_path)
    tif_filename = f'{layer_uuid}.tif'

    layer, _ = Layer.objects.get_or_create(
        unique_id=layer_uuid,
        layer_type=LayerType.RASTER_TILE,
        defaults={
            'name': internal_name,
            'created_by': analysis_task.submitted_by,
        }
    )

    if settings.DEBUG:
        layer_upload, _ = LayerUpload.objects.get_or_create(
            layer=layer,
            defaults={'created_by': layer.created_by}
        )
        layer_upload.emptying_folder()
        shutil.copy(file_path, layer_upload.filepath(tif_filename))
        is_success = True
    else:
        preferences = Preferences.load()
        base_url = settings.DJANGO_BACKEND_URL.rstrip('/')
        auth = f'Token {preferences.worker_layer_api_key}'
        upload_path = (
            base_url + f'/api/layer/{layer.id}/layer-upload/'
        )
        is_success = upload_file(upload_path, file_path, auth_header=auth)

    if not is_success:
        layer.delete()
        raise RuntimeError(
            f'COG upload failed for layer {layer_uuid}.'
        )

    layer.refresh_from_db()
    layer.is_ready = True
    layer.metadata = {'bounds': bounds}
    layer.save()

    if not add_to_map:
        logger.debug(
            'COG layer %s stored (add_to_map=False); '
            'skipping InputLayer registration.',
            layer_uuid,
        )
        return

    base_url = settings.DJANGO_BACKEND_URL.rstrip('/')
    tile_url = (
        f'cog://{base_url}' +
        reverse('serve-cog', kwargs={'layer_uuid': str(layer_uuid)})
    )

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
            'created_by': analysis_task.submitted_by,
            'updated_by': analysis_task.submitted_by,
            'metadata': {'bounds': bounds},
        }
    )


def _download_and_store_te_cog(
    cog_url: str,
    analysis_task: AnalysisTask,
    cog_index: int,
    bands: typing.Optional[typing.List[dict]] = None,
) -> None:
    """
    Download a COG from Trends.Earth and register it for map rendering.

    When ``bands`` metadata is provided (from a ``RasterResults`` payload)
    each band with ``add_to_map=True`` is extracted as an individual
    single-band COG and registered as a separate InputLayer in the
    'trends-earth' group.  Bands with ``add_to_map=False`` are stored as
    cloud_native_gis Layers (so they can be referenced later) but are NOT
    added to the map layer panel.

    When ``bands`` is not provided (e.g. CloudResults / legacy shapes) the
    whole downloaded file is registered as a single InputLayer, preserving
    the original behaviour.
    """
    # Deterministic base UUID for this (task, raster index) pair so that
    # retries are idempotent.
    base_uuid_seed = f'te-cog-{analysis_task.pk}-{cog_index}'

    try:
        with tempfile.TemporaryDirectory() as work_dir:
            raw_filename = f'{base_uuid_seed}.tif'
            raw_path = os.path.join(work_dir, raw_filename)

            logger.info(
                'Downloading TE COG for task %s index %s from %s',
                analysis_task.pk, cog_index, cog_url,
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
                        f'te_{analysis_task.task_type}_'
                        f'{analysis_task.pk}_{cog_index}_{band_idx}.tif'
                    )
                    band_path = os.path.join(
                        work_dir, f'{band_uuid}.tif'
                    )

                    _extract_single_band_cog(
                        raw_path, band_path, band_number, no_data
                    )

                    if add_to_map:
                        _register_cog_layer(
                            band_path,
                            band_uuid,
                            internal_name,
                            display_name,
                            analysis_task,
                            add_to_map=True,
                        )
                    else:
                        _register_cog_layer(
                            band_path,
                            band_uuid,
                            internal_name,
                            display_name,
                            analysis_task,
                            add_to_map=False,
                        )
            else:
                raster_uuid = uuid.uuid5(
                    uuid.NAMESPACE_OID, base_uuid_seed
                )
                internal_name = (
                    f'te_{analysis_task.task_type}_{analysis_task.pk}'
                    f'_{cog_index}.tif'
                )
                display_name = _build_te_layer_name(
                    analysis_task, cog_index
                )
                fix_no_data_value(work_dir, raw_filename)
                reprojected_path = os.path.join(
                    work_dir, f'{raster_uuid}_3857.tif'
                )
                _extract_single_band_cog(
                    raw_path, reprojected_path, band_number=1
                )
                _register_cog_layer(
                    reprojected_path,
                    raster_uuid,
                    internal_name,
                    display_name,
                    analysis_task,
                )

    except Exception as exc:
        logger.error(
            'TE COG download failed for task %s index %s: %s',
            analysis_task.pk, cog_index, exc,
            exc_info=True,
        )
        raise


@app.task(
    name='submit_te_job',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def submit_te_job(self, analysis_task_id: int):
    """
    Submit a Trends.Earth SDG 15.3.1 LDN job for an AnalysisTask.

    Expects analysis_task.analysis_inputs to contain:
        geojson      – GeoJSON geometry dict for the AOI
        year_initial – int
        year_final   – int
    """
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)
    inputs = analysis_task.analysis_inputs or {}
    _submit_te_job_for_task(
        self,
        analysis_task_id,
        submit_fn=submit_ldn_job,
        job_label='LDN',
        year_initial=int(inputs['year_initial']),
        year_final=int(inputs['year_final']),
    )


@app.task(
    name='poll_te_job_status',
    bind=True,
    max_retries=60,
    default_retry_delay=120,
)
def poll_te_job_status(self, analysis_task_id: int):
    """
    Poll the Trends.Earth API for job completion and, on success,
    download and store each COG output.
    """
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)

    if not analysis_task.te_execution_id:
        logger.error(
            'poll_te_job_status called for task %d '
            'but te_execution_id is not set.',
            analysis_task_id
        )
        return

    try:
        te_setting = TrendsEarthSetting.objects.get(
            user=analysis_task.submitted_by
        )
        access_token, new_refresh = refresh_access_token(
            te_setting.refresh_token
        )
        if new_refresh != te_setting.refresh_token:
            te_setting.refresh_token = new_refresh
            te_setting.save(update_fields=['refresh_token', 'updated_at'])

        exec_data = get_execution_status(
            access_token,
            analysis_task.te_execution_id
        )
        raw_status = (
            exec_data.get('data', exec_data).get('status', '')
            .upper()
        )

        # TE v2 API uses 'FINISHED' for successful completion.
        # 'COMPLETED' and 'SUCCESS' are kept for forward-compatibility.
        if raw_status in ('FINISHED', 'COMPLETED', 'SUCCESS'):
            cog_entries = extract_result_bands(exec_data)
            if not cog_entries:
                logger.warning(
                    'TE job %s completed but returned no COG URLs.',
                    analysis_task.te_execution_id
                )

            for idx, entry in enumerate(cog_entries):
                _download_and_store_te_cog(
                    entry['url'],
                    analysis_task,
                    idx,
                    bands=entry.get('bands') or None,
                )

            analysis_task.status = TaskStatus.COMPLETED
            analysis_task.result = {
                'cog_urls': [e['url'] for e in cog_entries],
                'execution_id': analysis_task.te_execution_id,
            }
            analysis_task.completed_at = timezone.now()
            analysis_task.save()

        elif raw_status in ('FAILED', 'ERROR', 'CANCELLED'):
            error_msg = (
                exec_data.get('data', exec_data).get('error', raw_status)
            )
            analysis_task.status = TaskStatus.FAILED
            analysis_task.error = {
                'message': f'Trends.Earth job failed: {error_msg}'
            }
            analysis_task.completed_at = timezone.now()
            analysis_task.save()

        else:
            logger.info(
                'TE job %s status=%s; will poll again.',
                analysis_task.te_execution_id, raw_status
            )
            raise self.retry(countdown=120)

    except (TrendsEarthAuthError, TrendsEarthAPIError) as exc:
        logger.error(
            'Error polling TE job for task %d: %s',
            analysis_task_id, exc
        )
        try:
            raise self.retry(exc=exc, countdown=120)
        except self.MaxRetriesExceededError:
            analysis_task.status = TaskStatus.FAILED
            analysis_task.error = {'message': str(exc)}
            analysis_task.completed_at = timezone.now()
            analysis_task.save()


def _submit_te_job_for_task(
    self,
    analysis_task_id: int,
    submit_fn,
    job_label: str,
    **submit_kwargs,
):
    """
    Shared implementation for submitting any Trends.Earth job type.

    Fetches the AnalysisTask, authenticates (using stored refresh token),
    calls ``submit_fn`` with the task's analysis_inputs plus any extra
    keyword arguments, stores the execution ID, and schedules polling.
    """
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)
    analysis_task.status = TaskStatus.RUNNING
    analysis_task.error = None
    analysis_task.save(update_fields=['status', 'error', 'updated_at'])

    try:
        te_setting = TrendsEarthSetting.objects.get(
            user=analysis_task.submitted_by
        )
    except TrendsEarthSetting.DoesNotExist:
        analysis_task.status = TaskStatus.FAILED
        analysis_task.error = {
            'message': (
                'No Trends.Earth credentials found for this user. '
                'Please configure them in Settings.'
            )
        }
        analysis_task.completed_at = timezone.now()
        analysis_task.save()
        return

    try:
        if te_setting.refresh_token:
            try:
                access_token, new_refresh = refresh_access_token(
                    te_setting.refresh_token
                )
                te_setting.refresh_token = new_refresh
                te_setting.save(
                    update_fields=['refresh_token', 'updated_at']
                )
            except TrendsEarthAuthError:
                logger.warning(
                    'Refresh token expired for user %s; '
                    'cannot re-authenticate without password.',
                    analysis_task.submitted_by_id
                )
                raise
        else:
            raise TrendsEarthAuthError(
                'No refresh token stored; user must re-authenticate.'
            )

        inputs = analysis_task.analysis_inputs or {}
        execution_id = submit_fn(
            access_token=access_token,
            geojson_geom=inputs['geojson'],
            **submit_kwargs,
        )
        analysis_task.te_execution_id = execution_id
        analysis_task.save(
            update_fields=['te_execution_id', 'updated_at']
        )

        # First poll after 30 s (job may finish quickly); subsequent
        # retries use the default_retry_delay of 120 s.
        poll_te_job_status.apply_async(
            args=[analysis_task_id],
            countdown=30
        )

    except (TrendsEarthAuthError, TrendsEarthAPIError) as exc:
        logger.error(
            'Trends.Earth %s job submission failed for task %d: %s',
            job_label, analysis_task_id, exc
        )
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            analysis_task.status = TaskStatus.FAILED
            analysis_task.error = {'message': str(exc)}
            analysis_task.completed_at = timezone.now()
            analysis_task.save()


@app.task(
    name='submit_drought_te_job',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def submit_drought_te_job(self, analysis_task_id: int):
    """
    Submit a Trends.Earth drought vulnerability job for an AnalysisTask.

    Expects analysis_task.analysis_inputs to contain:
        geojson      – GeoJSON geometry dict for the AOI
        year_initial – int
        year_final   – int
    """
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)
    inputs = analysis_task.analysis_inputs or {}
    _submit_te_job_for_task(
        self,
        analysis_task_id,
        submit_fn=submit_drought_job,
        job_label='Drought',
        year_initial=int(inputs['year_initial']),
        year_final=int(inputs['year_final']),
    )


@app.task(
    name='submit_urbanization_te_job',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def submit_urbanization_te_job(self, analysis_task_id: int):
    """
    Submit a Trends.Earth SDG 11.3.1 urbanization job for an
    AnalysisTask.

    Expects analysis_task.analysis_inputs to contain:
        geojson      – GeoJSON geometry dict for the AOI
        un_adju      – bool (default False)
        isi_thr      – int (default 30)
        ntl_thr      – int (default 10)
        wat_thr      – int (default 25)
        cap_ope      – int (default 200)
        pct_suburban – float (default 0.25)
        pct_urban    – float (default 0.50)
    """
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)
    inputs = analysis_task.analysis_inputs or {}
    _submit_te_job_for_task(
        self,
        analysis_task_id,
        submit_fn=submit_urbanization_job,
        job_label='Urbanization',
        un_adju=bool(inputs.get('un_adju', False)),
        isi_thr=int(inputs.get('isi_thr', 30)),
        ntl_thr=int(inputs.get('ntl_thr', 10)),
        wat_thr=int(inputs.get('wat_thr', 25)),
        cap_ope=int(inputs.get('cap_ope', 200)),
        pct_suburban=float(inputs.get('pct_suburban', 0.25)),
        pct_urban=float(inputs.get('pct_urban', 0.50)),
    )


@app.task(
    name='submit_population_te_job',
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def submit_population_te_job(self, analysis_task_id: int):
    """
    Submit a Trends.Earth population (GPW) download job for an
    AnalysisTask.

    Expects analysis_task.analysis_inputs to contain:
        geojson      – GeoJSON geometry dict for the AOI
        year_initial – int
        year_final   – int
    """
    analysis_task = AnalysisTask.objects.get(id=analysis_task_id)
    inputs = analysis_task.analysis_inputs or {}
    _submit_te_job_for_task(
        self,
        analysis_task_id,
        submit_fn=submit_population_job,
        job_label='Population',
        year_initial=int(inputs['year_initial']),
        year_final=int(inputs['year_final']),
    )
