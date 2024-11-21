from django.core.management.base import BaseCommand
import logging
import ee
from analysis.analysis import (
    initialize_engine_analysis,
    get_s2_cloud_masked,
    export_image_to_drive
)


class Command(BaseCommand):
    help = 'Test Earth Engine API initialization with a service account.'

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        initialize_engine_analysis()

        aoi = ee.Geometry.Rectangle([
            [30.0, -1.0],
            [30.01, -0.99]
        ])

        s2_collection = get_s2_cloud_masked(
            aoi, '2023-01-01', '2023-01-31')

        s2_median = s2_collection.median()

        vis_params = {
            'bands': ['red', 'green', 'blue'],
            'min': 0,
            'max': 3000
        }

        export_image_to_drive(
            image=s2_median,
            description='S2_Median_Export',
            folder='GEE_EXPORTS',
            file_name_prefix='S2_Median_Image',
            scale=10,
            region=aoi.getInfo()['coordinates'],
            max_pixels=1e7,
            vis_params=vis_params
        )
