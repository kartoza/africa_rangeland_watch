# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background task for analysis
"""
from core.celery import app
import uuid
import ee
from datetime import date
from dateutil.relativedelta import relativedelta

from django.utils import timezone
from analysis.models import (
    UserAnalysisResults,
    AnalysisResultsCache,
    AnalysisRasterOutput
)
from analysis.analysis import (
    export_image_to_drive,
    initialize_engine_analysis, InputLayer,
    get_rel_diff, calculate_temporal_to_img
)
from analysis.utils import get_gdrive_file, delete_gdrive_file
from layers.models import InputLayer as InputLayerFixture


def _run_spatial_analysis(data):
    """Run spatial analysis to get difference of relative layer."""
    input_layers = InputLayer()
    analysis_dict = {
        'landscape': '',
        'analysisType': 'Spatial',
        'variable': data['variable'],
        't_resolution': '',
        'Temporal': {
            'Annual': {
                'ref': '',
                'test': ''
            },
            'Quarterly': {
                'ref': '',
                'test': ''
            }
        },
        'Spatial': {
            'Annual': '',
            'Quarterly': ''
        }
    }
    rel_diff = get_rel_diff(
        input_layers.get_spatial_layer_dict(),
        analysis_dict,
        data['reference_layer']
    )
    return rel_diff


def _get_bounds(data):
    """Get bounds from a selected community by its latitude and longitude."""
    input_layers = InputLayer()
    selected_geos = input_layers.get_selected_geos()
    communities = input_layers.get_communities()
    geo = ee.Geometry.Point([data['longitude'], data['latitude']])
    selected_geos = selected_geos.merge(
        ee.FeatureCollection([ee.Feature(geo)])
    )
    return (
        communities.filterBounds(
            selected_geos
        ).getInfo()['features'][0]['geometry']
    )


@app.task(name='store_spatial_analysis_raster_output')
def store_spatial_analysis_raster_output(analysis_result_id: int):
    """Trigger task to store analysis raster output."""
    analysis_result = UserAnalysisResults.objects.get(id=analysis_result_id)
    data = analysis_result.analysis_results.get('data', None)
    if not data:
        return

    initialize_engine_analysis()

    bounds = _get_bounds(data)
    image = _run_spatial_analysis(data)
    filename = str(uuid.uuid4())
    export_image_to_drive(
        image=image,
        description='Spatial Analysis Relative Diff',
        folder='GEE_EXPORTS',
        file_name_prefix=filename,
        scale=10,
        region=bounds['coordinates'],
        vis_params={
            'min': -25,
            'max': 25,
            'palette': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
            'opacity': 0.7
        }
    )

    print(f'filename: {filename}.tif')
    analysis_result.raster_output_path = f'{filename}.tif'
    analysis_result.save()


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
    start_date = date(raster_output.analysis.get('year'), 1, 1)
    end_date = date(raster_output.analysis.get('year') + 1, 1, 1)
    resolution = 'year'
    resolution_step = 1
    month_filter = None
    if temporal_resolution == 'Monthly':
        start_date = start_date.replace(
            month=raster_output.analysis.get('month')
        )
        end_date = start_date + relativedelta(months=1)
        month_filter = raster_output.analysis.get('month')
        resolution = 'month'
    elif temporal_resolution == 'Quarterly':
        quarter_dict = {
            1: 1,
            2: 4,
            3: 7,
            4: 10
        }
        start_date = start_date.replace(
            month=quarter_dict[raster_output.analysis.get('quarter')]
        )
        end_date = start_date + relativedelta(months=3)
        resolution_step = 3
        month_filter = raster_output.analysis.get('quarter')
        resolution = 'month'

    print(f'Generating img {resolution} - {resolution_step} from {start_date} to {end_date}')
    # get aoi
    input_layers = InputLayer()
    communities = input_layers.get_communities()
    aoi = communities.filter(
        ee.Filter.inList(
            'Name', [raster_output.analysis.get('communityName')]
        )
    )

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
        region=aoi.geometry().bounds(),
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
