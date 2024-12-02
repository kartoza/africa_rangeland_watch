from django.core.management.base import BaseCommand
import logging
import ee
from analysis.analysis import (
    initialize_engine_analysis,
    get_s2_cloud_masked,
    export_image_to_drive,
    run_analysis
)


class Command(BaseCommand):
    help = 'Test Earth Engine API initialization with a service account.'

    def export_image(self):
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

    def run_baseline(self):
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Baseline',
            'variable': 'Limpopo NP',
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

        lat: -22.843383205972945
        lon: 31.64049468754881
        run_analysis(
            lon=31.64049468754881,
            lat=-22.843383205972945,
            analysisDict=analysis_dict
        )

    def run_spatial(self):
        analysis_dict = {
            'landscape': 'Limpopo NP',
            'analysisType': 'Spatial',
            'variable': 'EVI',
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

        reference_layer_geojson = {
            "type": "Polygon",
            "coordinates": [
              [
                [31.77233062504881, -23.242716855208695],
                [32.01402984379881, -23.15688439753154],
                [31.73387847661131, -23.101316414030528],
                [31.77233062504881, -23.242716855208695]
              ]
            ]
          }
        run_analysis(
            lon=reference_layer_geojson['coordinates'][0][0][0],
            lat=reference_layer_geojson['coordinates'][0][0][1],
            analysisDict=analysis_dict,
            **{'reference_layer': reference_layer_geojson}
        )


    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        initialize_engine_analysis()

        self.export_image()
        self.run_baseline()
        self.run_spatial()
