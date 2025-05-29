from django.test import TestCase
from unittest.mock import patch, ANY, MagicMock
from django.contrib.auth.models import User

from analysis.tasks import (
    store_spatial_analysis_raster_output,
    generate_temporal_analysis_raster_output
)
from analysis.models import UserAnalysisResults
from django.test import TestCase
from unittest.mock import patch, ANY
from django.contrib.auth.models import User
from analysis.models import UserAnalysisResults, AnalysisRasterOutput


def do_nothing(uuid, name, gdrive_file, metadata):
    pass


class TestStoreAnalysisRasterOutput(TestCase):

    fixtures = [
        '3.gee_asset.json',
        '1.layer_group_type.json',
        '2.data_provider.json',
        '3.input_layer.json'
    ]

    @patch('analysis.tasks.export_image_to_drive')
    @patch('analysis.tasks._run_spatial_analysis')
    @patch('analysis.tasks._get_bounds')
    @patch('analysis.tasks.initialize_engine_analysis')
    def test_store_spatial_analysis_raster_output(
        self, mock_initialize_engine_analysis, mock_get_bounds,
        mock_run_spatial_analysis, mock_export_image_to_drive
    ):
        # Mock data
        user = User.objects.create(username='testuser', password='12345')
        mock_analysis_result = UserAnalysisResults.objects.create(
            created_by=user,
            analysis_results={
                'data': {
                    'variable': 'some_variable',
                    'reference_layer': 'some_reference_layer',
                    'longitude': 34.0,
                    'latitude': -1.0
                }
            },
            raster_output_path=''
        )
        
        # Mock return values
        mock_get_bounds.return_value = {'coordinates': [34.0, -1.0]}
        mock_run_spatial_analysis.return_value = 'mock_image'

        store_spatial_analysis_raster_output(mock_analysis_result.id)
        
        # Assertions
        mock_initialize_engine_analysis.assert_called_once()
        mock_get_bounds.assert_called_once_with(
            mock_analysis_result.analysis_results['data']
        )
        mock_run_spatial_analysis.assert_called_once_with(
            mock_analysis_result.analysis_results['data']
        )
        mock_export_image_to_drive.assert_called_once_with(
            image='mock_image',
            description='Spatial Analysis Relative Diff',
            folder='GEE_EXPORTS',
            file_name_prefix=ANY,
            scale=10,
            region=[34.0, -1.0],
            vis_params={
                'min': -25,
                'max': 25,
                'palette': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
                'opacity': 0.7
            }
        )
        mock_analysis_result.refresh_from_db()
        self.assertTrue(
            mock_analysis_result.raster_output_path.endswith('.tif')
        )

    @patch('analysis.tasks.store_cog_as_layer')
    @patch('analysis.tasks.ee')
    @patch('analysis.tasks.InputLayer')
    @patch('analysis.tasks.export_image_to_drive')
    @patch('analysis.tasks.calculate_temporal_to_img')
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
    @patch('analysis.tasks.calculate_temporal_to_img')
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
