# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background task for analysis
"""
from core.celery import app
import uuid
import ee

from django.utils import timezone
from analysis.models import (
    UserAnalysisResults,
    AnalysisResultsCache,
    AnalysisRasterOutput
)
from analysis.analysis import (
    export_image_to_drive,
    initialize_engine_analysis, InputLayer,
    get_rel_diff
)


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

    initialize_engine_analysis()
    # TODO: generate the image


@app.task(name='clear_analysis_results_cache', ignore_result=True)
def clear_analysis_results_cache():
    """Trigger task to generate layers using GEE."""
    AnalysisResultsCache.objects.filter(
        expired_at__lt=timezone.now()
    ).delete()
