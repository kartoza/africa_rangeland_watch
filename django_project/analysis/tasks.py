# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background task for analysis
"""
import os
from core.celery import app
import ee
import logging
import tempfile
import shutil
import time
import subprocess
from datetime import date
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

from cloud_native_gis.models.layer import Layer, LayerType
from cloud_native_gis.models.layer_upload import LayerUpload
from core.models import TaskStatus, Preferences
from analysis.models import (
    AnalysisResultsCache,
    AnalysisRasterOutput,
    AnalysisTask
)
from analysis.analysis import (
    export_image_to_drive,
    initialize_engine_analysis, InputLayer,
    get_rel_diff, calculate_temporal_to_img,
    spatial_get_date_filter
)
from analysis.runner import AnalysisRunner
from analysis.utils import (
    get_gdrive_file,
    delete_gdrive_file,
    get_cog_bounds,
    get_date_range_for_analysis
)
from layers.models import InputLayer as InputLayerFixture
from layers.utils import upload_file

logger = logging.getLogger(__name__)
User = get_user_model()


def _run_spatial_analysis(data):
    """Run spatial analysis to get difference of relative layer."""
    input_layers = InputLayer()
    reference_layer_geom = AnalysisRunner.get_reference_layer_geom(data)
    (
        spatial_analysis_dict,
        temporal_analysis_dict
    ) = AnalysisRunner.get_analysis_dict_spatial(data)
    filter_start_date, filter_end_date = spatial_get_date_filter(
        spatial_analysis_dict
    )
    rel_diff = get_rel_diff(
        input_layers.get_spatial_layer_dict(
            filter_start_date, filter_end_date
        ),
        spatial_analysis_dict,
        reference_layer_geom
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

    aoi = _get_bounds(raster_output)
    vis_params = {
        'min': -25,
        'max': 25,
        'palette': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
        'opacity': 0.7
    }
    image = _run_spatial_analysis(raster_output.analysis)

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

    # find input layer for get the vis param config
    input_layer_fixture = InputLayerFixture.objects.get(
        name=raster_output.analysis.get('variable')
    )

    # generate the image
    img = calculate_temporal_to_img(
        aoi, start_date.isoformat(), end_date.isoformat(),
        resolution, resolution_step,
        'bare' if raster_output.analysis.get('variable') == 'Bare ground' else
        raster_output.analysis.get('variable').lower()
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
        runner = AnalysisRunner()
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
