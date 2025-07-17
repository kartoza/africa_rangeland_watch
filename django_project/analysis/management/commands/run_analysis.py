import ee
import logging
from django.core.management.base import BaseCommand
from analysis.analysis import initialize_engine_analysis
from analysis.tasks import run_analysis_task


class Command(BaseCommand):
    help = 'Test Earth Engine API initialization with a service account.'

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        run_analysis_task(215)

