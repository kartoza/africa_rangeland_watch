from django.test import TestCase, RequestFactory
from django.urls import reverse
from unittest.mock import patch, MagicMock
from django.http import StreamingHttpResponse, Http404

from analysis.admin import UserAnalysisResultsAdmin, clear_raster_output
from analysis.models import UserAnalysisResults


class UserAnalysisResultsAdminTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.admin = UserAnalysisResultsAdmin(
            model=UserAnalysisResults,
            admin_site=None
        )
        self.user_analysis_result = UserAnalysisResults.objects.create(
            created_by_id=1,
            source='test_source',
            raster_output_path='test_path'
        )

    @patch('analysis.admin.get_gdrive_file')
    def test_download_file(self, mock_get_gdrive_file):
        mock_file = MagicMock()
        mock_file.content.read.side_effect = [b'test_data', b'']
        mock_get_gdrive_file.return_value = mock_file

        request = self.factory.get(
            reverse(
                'admin:analysis_results_download_file',
                args=[self.user_analysis_result.pk]
            )
        )
        response = self.admin.download_file(
            request,
            self.user_analysis_result.pk
        )

        self.assertIsInstance(response, StreamingHttpResponse)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get('Content-Disposition'),
            'attachment; filename="test_path"'
        )

    @patch('analysis.admin.get_gdrive_file')
    def test_download_file_not_found_in_gdrive(self, mock_get_gdrive_file):
        mock_get_gdrive_file.return_value = None

        request = self.factory.get(
            reverse(
                'admin:analysis_results_download_file',
                args=[self.user_analysis_result.pk]
            )
        )
        with self.assertRaises(Http404):
            self.admin.download_file(request, self.user_analysis_result.pk)

    def test_download_file_no_raster_output_path(self):
        self.user_analysis_result.raster_output_path = None
        self.user_analysis_result.save()

        request = self.factory.get(
            reverse(
                'admin:analysis_results_download_file',
                args=[self.user_analysis_result.pk]
            )
        )
        with self.assertRaises(Http404):
            self.admin.download_file(request, self.user_analysis_result.pk)

    @patch('analysis.admin.delete_gdrive_file')
    def test_clear_raster_output(self, mock_delete_gdrive_file):
        mock_delete_gdrive_file.return_value = True

        queryset = UserAnalysisResults.objects.filter(
            pk=self.user_analysis_result.pk
        )
        clear_raster_output(None, None, queryset)

        self.user_analysis_result.refresh_from_db()
        self.assertIsNone(self.user_analysis_result.raster_output_path)

    @patch('analysis.admin.delete_gdrive_file')
    def test_clear_raster_output_file_not_deleted(
        self, mock_delete_gdrive_file
    ):
        mock_delete_gdrive_file.return_value = False

        queryset = UserAnalysisResults.objects.filter(
            pk=self.user_analysis_result.pk
        )
        clear_raster_output(None, None, queryset)

        self.user_analysis_result.refresh_from_db()
        self.assertIsNotNone(self.user_analysis_result.raster_output_path)
