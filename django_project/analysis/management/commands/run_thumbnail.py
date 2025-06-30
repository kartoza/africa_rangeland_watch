import ee
import logging
from django.core.management.base import BaseCommand
from analysis.analysis import (
    initialize_engine_analysis,
    get_s2_cloud_masked,
    export_image_to_drive,
    run_analysis
)
from dashboard.models import Dashboard, DashboardWidget
from analysis.models import UserAnalysisResults


class Command(BaseCommand):
    help = 'Test Earth Engine API initialization with a service account.'

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        # b4e20b62-aa35-4223-bc79-c4ec5ea03658
        dashboard = Dashboard.objects.get(uuid='b4e20b62-aa35-4223-bc79-c4ec5ea03658')
        result_ids = DashboardWidget.objects.filter(dashboard=dashboard).values_list('analysis_result', flat=True)
        result = UserAnalysisResults.objects.filter(id__in=result_ids).first()
        location_ids = [loc['community'] for loc in result.analysis_results['data']['locations']]
        dashboard.generate_and_save_thumbnail()

