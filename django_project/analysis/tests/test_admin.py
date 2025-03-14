from django.test import TestCase, RequestFactory
from django.urls import reverse
from unittest.mock import patch, MagicMock
from django.http import StreamingHttpResponse, Http404

from analysis.admin import AnalysisRasterOutputAdmin
from analysis.models import AnalysisRasterOutput


class AnalysisRasterOutputAdminTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.admin = AnalysisRasterOutputAdmin(
            model=AnalysisRasterOutput,
            admin_site=None
        )
        self.raster_output = AnalysisRasterOutput.objects.create(
            analysis={
                'analysisType': 'Temporal',
                'temporalResolution': 'Quarterly',
                'year': 2021,
                'quarter': 1,
                'communityName': 'Test Community',
                'variable': 'Bare ground'
            },
            name='mock_filename',
            status='COMPLETED'
        )

    @patch('analysis.admin.get_gdrive_file')
    def test_download_file(self, mock_get_gdrive_file):
        mock_file = MagicMock()
        mock_file.content.read.side_effect = [b'test_data', b'']
        mock_get_gdrive_file.return_value = mock_file

        request = self.factory.get(
            reverse(
                'admin:analysis_results_download_file',
                args=[self.raster_output.pk]
            )
        )
        response = self.admin.download_file(
            request,
            self.raster_output.pk
        )

        self.assertIsInstance(response, StreamingHttpResponse)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get('Content-Disposition'),
            'attachment; filename="mock_filename"'
        )

    @patch('analysis.admin.get_gdrive_file')
    def test_download_file_not_found_in_gdrive(self, mock_get_gdrive_file):
        mock_get_gdrive_file.return_value = None

        request = self.factory.get(
            reverse(
                'admin:analysis_results_download_file',
                args=[self.raster_output.pk]
            )
        )
        with self.assertRaises(Http404):
            self.admin.download_file(request, self.raster_output.pk)

    def test_download_file_no_raster_output_path(self):
        self.raster_output.status = 'FAILED'
        self.raster_output.save()

        request = self.factory.get(
            reverse(
                'admin:analysis_results_download_file',
                args=[self.raster_output.pk]
            )
        )
        with self.assertRaises(Http404):
            self.admin.download_file(request, self.raster_output.pk)
