import ee
import logging
from django.core.management.base import BaseCommand
from layers.generator.trends_earth import TrendsEarthGenerator
from analysis.analysis import initialize_engine_analysis
from analysis.analysis import calculate_land_degradation_baseline


class Command(BaseCommand):
    help = 'Test Earth Engine API initialization with a service account.'


    def handle(self, *args, **options):
        # logging.basicConfig(level=logging.DEBUG)

        # initialize_engine_analysis()

        # initialize_engine_analysis()
        # instance = TrendsEarthGenerator()
        # instance.generate()
        # # ~2km x 2km square (~4 km²) near Pretoria, South Africa
        # lon, lat = 28.18, -25.75
        # half_lat = 0.009   # ~1 km in latitude
        # half_lon = 0.0105  # ~1 km in longitude at -25.75°
        # geom = ee.FeatureCollection([ee.Feature(
        #     ee.Geometry.Polygon([[
        #         [lon - half_lon, lat - half_lat],
        #         [lon + half_lon, lat - half_lat],
        #         [lon + half_lon, lat + half_lat],
        #         [lon - half_lon, lat + half_lat],
        #         [lon - half_lon, lat - half_lat],
        #     ]]),
        #     {'Name': 'Test Area', 'Area ha': 400}
        # )])
        # reduced = calculate_land_degradation_baseline(geom)
        # print(reduced.getInfo())

        from analysis.tasks import run_analysis_task

        a = run_analysis_task(434)