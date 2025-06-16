import ee
import logging
from django.core.management.base import BaseCommand
from earthranger.utils import fetch_all_earth_ranger_data

class Command(BaseCommand):
    help = 'Test Earth Eanger Events fetch'

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        fetch_all_earth_ranger_data()