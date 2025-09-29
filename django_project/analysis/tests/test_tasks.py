import datetime
from django.test import TestCase
from unittest.mock import patch, ANY, MagicMock
from django.contrib.auth.models import User

from analysis.tasks import (
    store_spatial_analysis_raster_output,
    generate_temporal_analysis_raster_output
)
from core.factories import UserF
from django.test import TestCase
from unittest.mock import patch, ANY
from django.contrib.auth.models import User
from analysis.models import (
    UserAnalysisResults, 
    AnalysisRasterOutput, 
    UserIndicator,
    AnalysisTask,
    GEEAssetType,
    IndicatorSource,
    Indicator
)
from analysis.factories import UserGEEAssetF, UserIndicatorF
from analysis.runner import AnalysisRunner


def do_nothing(uuid, name, gdrive_file, metadata):
    pass


class TestStoreAnalysisRasterOutput(TestCase):

    fixtures = [
        '3.gee_asset.json',
        '1.layer_group_type.json',
        '2.data_provider.json',
        '3.input_layer.json',
        '4.indicator.json'
    ]

    def setUp(self):
        self.user = UserF.create()
        return super().setUp()

    @patch('analysis.tasks.store_cog_as_layer')
    @patch('analysis.tasks.ee')
    @patch('analysis.tasks.export_image_to_drive')
    @patch('analysis.tasks._run_spatial_analysis')
    @patch('analysis.tasks._get_bounds')
    @patch('analysis.tasks.delete_gdrive_file')
    @patch('analysis.tasks.get_gdrive_file')
    @patch('analysis.tasks.initialize_engine_analysis')
    def test_store_spatial_analysis_raster_output(
        self, mock_initialize_engine_analysis,
        mock_get_gdrive_file, mock_delete_gdrive_file,
        mock_get_bounds,
        mock_run_spatial_analysis, mock_export_image_to_drive,
        mock_ee, mock_store_cog_as_layer
    ):
        # Mock data
        mock_raster_output = AnalysisRasterOutput.objects.create(
            analysis={
                'analysisType': 'Spatial',
                'temporalResolution': '',
                'year': None,
                'locations': [
                    {
                        'lat': -23.035376296859013,
                        'lon': 32.192377992891466,
                        'community': '00000000000000000161',
                        'communityName': 'LNP-BNP corridor',
                        'communityFeatureId': 430
                    }
                ],
                'variable': 'EVI'
            },
            name='mock_filename',
            status='PENDING'
        )
        # Mock return values
        # mock_get_bounds.return_value = {'coordinates': [34.0, -1.0]}
        user_analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={
                'data': mock_raster_output.analysis,
                'results': []
            }
        )
        user_analysis_result.raster_outputs.add(mock_raster_output)
        AnalysisTask.objects.create(
            analysis_inputs=mock_raster_output.analysis,
            submitted_by=self.user
        )
        mock_ee.return_value = MagicMock()
        mock_run_spatial_analysis.return_value = 'mock_image'
        mock_export_image_to_drive.return_value = {'state': 'COMPLETED'}
        gdrive_file = MagicMock()
        gdrive_file.get.return_value = 100
        mock_get_gdrive_file.return_value = gdrive_file
        mock_store_cog_as_layer.side_effect = do_nothing

        store_spatial_analysis_raster_output(mock_raster_output.uuid)
        
        # Assertions
        mock_initialize_engine_analysis.assert_called_once()
        mock_get_bounds.assert_called_once()
        mock_run_spatial_analysis.assert_called_once_with(
            mock_raster_output,
            Indicator.objects.get(variable_name='EVI')
        )
        mock_export_image_to_drive.assert_called_once()
        mock_raster_output.refresh_from_db()
        self.assertEqual(mock_raster_output.status, 'COMPLETED')
        self.assertEqual(mock_raster_output.size, 100)

    @patch('analysis.tasks.store_cog_as_layer')
    @patch('analysis.tasks.ee')
    @patch('analysis.tasks.export_image_to_drive')
    @patch('analysis.tasks.get_rel_diff')
    @patch('analysis.tasks._get_bounds')
    @patch('analysis.tasks.delete_gdrive_file')
    @patch('analysis.tasks.get_gdrive_file')
    @patch('analysis.tasks.initialize_engine_analysis')
    @patch('analysis.tasks.InputLayer')
    @patch('analysis.tasks.spatial_get_date_filter')
    @patch.object(UserIndicator, 'get_reducer')
    @patch.object(AnalysisRunner, 'get_analysis_dict_spatial')
    def test_store_spatial_analysis_raster_output_custom_reducer(
        self, mock_get_analysis_dict_spatial, mock_get_reducer,  mock_spatial_get_date_filter,
        mock_input_layer, mock_initialize_engine_analysis,
        mock_get_gdrive_file, mock_delete_gdrive_file,
        mock_get_bounds,
        mock_get_rel_diff, mock_export_image_to_drive,
        mock_ee, mock_store_cog_as_layer
    ):
        mock_get_analysis_dict_spatial.return_value = ({}, {})
        mock_spatial_get_date_filter.return_value = (
            datetime.date(2020, 1, 1),
            datetime.date(2021, 1, 1)
        )
        mock_raster_output = AnalysisRasterOutput.objects.create(
            analysis={
                'analysisType': 'Spatial',
                'temporalResolution': '',
                'year': None,
                'locations': [
                    {
                        'lat': -23.035376296859013,
                        'lon': 32.192377992891466,
                        'community': '00000000000000000161',
                        'communityName': 'LNP-BNP corridor',
                        'communityFeatureId': 430
                    }
                ],
                'variable': 'EVI',
                'reference_layer': {},
                'variable': 'Custom Temperature'
            },
            name='mock_filename',
            status='PENDING'
        )

        user_analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={
                'data': mock_raster_output.analysis,
                'results': []
            }
        )
        user_analysis_result.raster_outputs.add(mock_raster_output)
        AnalysisTask.objects.create(
            analysis_inputs=mock_raster_output.analysis,
            submitted_by=self.user
        )

        UserGEEAssetF(
            key="temperature-asset",
            created_by=self.user,
            type=GEEAssetType.IMAGE_COLLECTION,
            source="projects/sample/temperature",
            metadata={
                "end_date": "2025-08-11",
                "start_date": "2002-01-01",
                "band_names": ["tmax", "tmin"]
            }
        )
        
        # Create UserIndicator for Custom Temperature
        user_indicator = UserIndicatorF(
            name="Custom Temperature",
            variable_name="Custom Temperature",
            created_by=self.user,
            source=IndicatorSource.OTHER,
            analysis_types=["Baseline", "Temporal", "Spatial"],
            temporal_resolutions=["Annual", "Monthly", "Quarterly"],
            metadata={
                "maxValue": 50,
                "minValue": -40,
                "colors": ["#ADD8E6", "#008000", "#FFFF00", "#FFA500", "#FF0000", "#800080"],
                "opacity": 0.7
            },
            config={"asset_keys": ["temperature-asset"], 'reducer': 'median'}
        )

        rel_diff = MagicMock()
        # Mock getMapId return value
        rel_diff.getMapId.return_value = {
            "tile_fetcher": MagicMock(url_format="http://mocked-url/{z}/{x}/{y}.png")
        }
        mock_get_rel_diff.return_value = rel_diff
        mock_get_reducer.return_value = user_indicator.get_reducer_name()

        # Mock return values
        # mock_get_bounds.return_value = {'coordinates': [34.0, -1.0]}
        mock_ee.return_value = MagicMock()
        mock_export_image_to_drive.return_value = {'state': 'COMPLETED'}
        gdrive_file = MagicMock()
        gdrive_file.get.return_value = 100
        mock_get_gdrive_file.return_value = gdrive_file
        mock_store_cog_as_layer.side_effect = do_nothing

        store_spatial_analysis_raster_output(mock_raster_output.uuid)
        
        # Assertions
        mock_initialize_engine_analysis.assert_called_once()
        mock_get_bounds.assert_called_once()
        mock_export_image_to_drive.assert_called_once()
        mock_raster_output.refresh_from_db()
        self.assertEqual(mock_raster_output.status, 'COMPLETED')
        self.assertEqual(mock_raster_output.size, 100)

    @patch('analysis.tasks.store_cog_as_layer')
    @patch('analysis.tasks.ee')
    @patch('analysis.tasks.InputLayer')
    @patch('analysis.tasks.export_image_to_drive')
    @patch('analysis.tasks.calculate_temporal_modis_veg')
    @patch('analysis.tasks.delete_gdrive_file')
    @patch('analysis.tasks.get_gdrive_file')
    @patch('analysis.tasks.initialize_engine_analysis')
    def test_generate_temporal_analysis_raster_output(
        self, mock_initialize_engine_analysis,
        mock_get_gdrive_file, mock_delete_gdrive_file,
        mock_calculate_temporal_to_img,
        mock_export_image_to_drive, mock_input_layer, mock_ee,
        mock_store_cog_as_layer
    ):
        # Mock data
        mock_raster_output = AnalysisRasterOutput.objects.create(
            analysis={
                'analysisType': 'Temporal',
                'temporalResolution': 'Annual',
                'year': 2021,
                'locations': [
                    {
                        'lat': -23.035376296859013,
                        'lon': 32.192377992891466,
                        'community': '00000000000000000161',
                        'communityName': 'LNP-BNP corridor',
                        'communityFeatureId': 430
                    }
                ],
                'variable': 'Bare ground'
            },
            name='mock_filename',
            status='PENDING'
        )
        user_analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={
                'data': mock_raster_output.analysis,
                'results': []
            }
        )
        user_analysis_result.raster_outputs.add(mock_raster_output)
        AnalysisTask.objects.create(
            analysis_inputs=mock_raster_output.analysis,
            submitted_by=self.user
        )

        filename = AnalysisRasterOutput.generate_name(
            mock_raster_output.analysis
        )
        self.assertEqual(
            filename,
            'LNP-BNP_corridor_bare_ground_temporal_annual_2021.tif'
        )

        # Mock return values
        mock_input_layer.get_countries.return_value = MagicMock()
        mock_input_layer.get_communities.return_value = MagicMock()
        mock_ee.return_value = MagicMock()
        mock_calculate_temporal_to_img.return_value = MagicMock()
        mock_export_image_to_drive.return_value = {'state': 'COMPLETED'}
        gdrive_file = MagicMock()
        gdrive_file.get.return_value = 100
        mock_get_gdrive_file.return_value = gdrive_file
        mock_store_cog_as_layer.side_effect = do_nothing

        generate_temporal_analysis_raster_output(mock_raster_output.uuid)

        # Assertions
        mock_initialize_engine_analysis.assert_called_once()
        mock_delete_gdrive_file.assert_called_once_with(
            f'{mock_raster_output.uuid}.tif'
        )
        mock_calculate_temporal_to_img.assert_called_once()
        mock_export_image_to_drive.assert_called_once_with(
            image=ANY,
            description=mock_raster_output.name,
            folder='GEE_EXPORTS',
            file_name_prefix=str(mock_raster_output.uuid),
            scale=120,
            region=ANY,
            vis_params=ANY
        )
        mock_raster_output.refresh_from_db()
        self.assertEqual(mock_raster_output.status, 'COMPLETED')
        self.assertEqual(mock_raster_output.size, 100)

    @patch('analysis.tasks.store_cog_as_layer')
    @patch('analysis.tasks.ee')
    @patch('analysis.tasks.InputLayer')
    @patch('analysis.tasks.export_image_to_drive')
    @patch('analysis.tasks.calculate_temporal_modis_veg')
    @patch('analysis.tasks.delete_gdrive_file')
    @patch('analysis.tasks.get_gdrive_file')
    @patch('analysis.tasks.initialize_engine_analysis')
    def test_generate_temporal_analysis_raster_output_failed_gdrive(
        self, mock_initialize_engine_analysis,
        mock_get_gdrive_file, mock_delete_gdrive_file,
        mock_calculate_temporal_to_img,
        mock_export_image_to_drive, mock_input_layer, mock_ee,
        mock_store_cog_as_layer
    ):
        # Mock data
        mock_raster_output = AnalysisRasterOutput.objects.create(
            analysis={
                'analysisType': 'Temporal',
                'temporalResolution': 'Quarterly',
                'year': 2021,
                'quarter': 1,
                'locations': [
                    {
                        'lat': -23.035376296859013,
                        'lon': 32.192377992891466,
                        'community': '00000000000000000161',
                        'communityName': 'LNP-BNP corridor',
                        'communityFeatureId': 430
                    }
                ],
                'variable': 'Bare ground'
            },
            name='mock_filename',
            status='PENDING'
        )
        user_analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={
                'data': mock_raster_output.analysis,
                'results': []
            }
        )
        user_analysis_result.raster_outputs.add(mock_raster_output)
        AnalysisTask.objects.create(
            analysis_inputs=mock_raster_output.analysis,
            submitted_by=self.user
        )

        filename = AnalysisRasterOutput.generate_name(
            mock_raster_output.analysis
        )
        self.assertEqual(
            filename,
            'LNP-BNP_corridor_bare_ground_temporal_quarterly_Q1_2021.tif'
        )

        # Mock return values
        mock_input_layer.get_countries.return_value = MagicMock()
        mock_input_layer.get_communities.return_value = MagicMock()
        mock_ee.return_value = MagicMock()
        mock_calculate_temporal_to_img.return_value = MagicMock()
        mock_export_image_to_drive.return_value = {'state': 'COMPLETED'}
        mock_get_gdrive_file.return_value = None
        mock_store_cog_as_layer.side_effect = do_nothing

        generate_temporal_analysis_raster_output(mock_raster_output.uuid)

        # Assertions
        mock_initialize_engine_analysis.assert_called_once()
        mock_delete_gdrive_file.assert_called_once_with(
            f'{mock_raster_output.uuid}.tif'
        )
        mock_calculate_temporal_to_img.assert_called_once()
        mock_export_image_to_drive.assert_called_once_with(
            image=ANY,
            description=mock_raster_output.name,
            folder='GEE_EXPORTS',
            file_name_prefix=str(mock_raster_output.uuid),
            scale=120,
            region=ANY,
            vis_params=ANY
        )
        mock_raster_output.refresh_from_db()
        self.assertEqual(mock_raster_output.status, 'FAILED')
        self.assertEqual(
            mock_raster_output.status_logs['gdrive_error'],
            f'File {mock_raster_output.raster_filename} not found!'
        )
