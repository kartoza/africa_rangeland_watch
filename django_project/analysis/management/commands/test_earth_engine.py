import ee
import logging
from django.core.management.base import BaseCommand
from analysis.analysis import (
    initialize_engine_analysis,
    get_s2_cloud_masked,
    export_image_to_drive,
    run_analysis
)


class Command(BaseCommand):
    help = 'Test Earth Engine API initialization with a service account.'

    def export_image(self):
        """
        Export GEE image to Google Drive
        """
        print("Running export image")
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

    def run_baseline_analysis(self):
        """
        Run baseline analysis
        """
        print("Running baseline analysis")
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Baseline',
            'variable': 'Limpopo NP',
            't_resolution': '',
            'Baseline': {
                'startDate': '',
                'endDate': ''
            },
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

        lat = -22.843383205972945
        lon = 31.64049468754881
        baseline = run_analysis(
            locations=[{
                'lon': lon,
                'lat': lat,
            }],
            analysis_dict=analysis_dict
        )
        print(baseline)

    def run_spatial_analysis(self):
        """
        Run spatial analysis
        """
        print("Running spatial analysis")
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
        spatial = run_analysis(
            locations=[{
                'lon': reference_layer_geojson['coordinates'][0][0][0],
                'lat': reference_layer_geojson['coordinates'][0][0][1],
            }],
            analysis_dict=analysis_dict,
            **{'reference_layer': reference_layer_geojson}
        )
        print(spatial)

    def run_annual_temporal_analysis(self):
        """
        Run annual analysis
        """
        print("Running annual temporal analysis")
        analysis_dict = {
            'landscape': 'Limpopo NP',
            'analysisType': 'Temporal',
            'variable': 'EVI',
            't_resolution': 'Annual',
            'Temporal': {
                'Annual': {
                    'ref': '2017',
                    'test': '2023'
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
        lat = -22.843383205972945
        lon = 31.64049468754881
        temporal_output, temporal_output_plot = run_analysis(
            locations=[{
                'lon': lon,
                'lat': lat,
            }],
            analysis_dict=analysis_dict
        )
        print('Temporal Output: \n', temporal_output)
        print('\n')
        print('Temporal Output Plot: \n', temporal_output_plot)

    def run_quarterly_temporal_analysis(self):
        """
        Run quarterly temporal analysis
        """
        print("Running quarterly temporal analysis")

        analysis_dict = {
            'landscape': 'Limpopo NP',
            'analysisType': 'Temporal',
            'variable': 'EVI',
            't_resolution': 'Quarterly',
            'Temporal': {
                'Annual': {
                    'ref': 2017,
                    'test': 2022
                },
                'Quarterly': {
                    'ref': 1,
                    'test': 1
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }
        lat = -22.843383205972945
        lon = 31.64049468754881
        temporal_output, temporal_output_plot = run_analysis(
            locations=[{
                'lon': lon,
                'lat': lat,
            }],
            analysis_dict=analysis_dict
        )
        print('Temporal Output: \n', temporal_output)
        print('\n')
        print('Temporal Output Plot: \n', temporal_output_plot)

    def run_monthly_temporal_analysis(self):
        """
        Run monthly temporal analysis
        """
        print("Running monthly temporal analysis")

        analysis_dict = {
            'landscape': 'Limpopo NP',
            'analysisType': 'Temporal',
            'variable': 'EVI',
            't_resolution': 'Monthly',
            'Temporal': {
                'Annual': {
                    'ref': 2023,
                    'test': 2023
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                },
                'Monthly': {
                    'ref': 5,
                    'test': 8
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }
        lat = -22.843383205972945
        lon = 31.64049468754881
        temporal_output, temporal_output_plot = run_analysis(
            locations=[{
                'lon': lon,
                'lat': lat,
            }],
            analysis_dict=analysis_dict
        )
        print('Temporal Output: \n', temporal_output)
        print('\n')
        print('Temporal Output Plot: \n', temporal_output_plot)

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        initialize_engine_analysis()

        # self.export_image()
        # self.run_baseline_analysis()
        # self.run_spatial_analysis()
        # self.run_annual_temporal_analysis()
        # self.run_quarterly_temporal_analysis()
        self.run_monthly_temporal_analysis()
