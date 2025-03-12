from django.test import TestCase
from unittest.mock import patch, ANY
from django.contrib.auth.models import User

from analysis.tasks import store_spatial_analysis_raster_output
from analysis.models import UserAnalysisResults


class TestStoreAnalysisRasterOutput(TestCase):

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
