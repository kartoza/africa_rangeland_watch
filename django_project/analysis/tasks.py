# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background task for analysis
"""
from core.celery import app

from analysis.models import UserAnalysisResults
from analysis.analysis import export_image_to_drive


@app.task(name='store_analysis_raster_output')
def store_analysis_raster_output(analysis_result_id: int):
    """Trigger task to store analysis raster output."""
    analysis_result = UserAnalysisResults.objects.get(id=analysis_result_id)

    # TODO: re-run analysis or check how to refer the analysis object
    # TODO: run export_image_to_drive
