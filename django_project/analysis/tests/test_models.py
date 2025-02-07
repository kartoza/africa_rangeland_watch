from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch
from analysis.models import UserAnalysisResults

class UserAnalysisResultsTest(TestCase):

    def setUp(self):
        self.user = User.objects.create(username='testuser', password='12345')
        self.analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={"result": "test"},
            raster_output_path='path/to/raster/output'
        )

    @patch('analysis.utils.delete_gdrive_file')
    def test_delete_gdrive_file_called_on_delete(
        self, mock_delete_gdrive_file
    ):
        self.analysis_result.delete()
        mock_delete_gdrive_file.assert_called_once_with(
            'path/to/raster/output'
        )
