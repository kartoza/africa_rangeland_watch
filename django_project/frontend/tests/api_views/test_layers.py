# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Layers API.
"""

import mock
import uuid
from django.urls import reverse
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from cloud_native_gis.models.layer import Layer
from cloud_native_gis.models.layer_upload import LayerUpload

from core.settings.utils import absolute_path
from core.models import TaskStatus
from core.tests.common import BaseAPIViewTest
from layers.models import (
    InputLayer, InputLayerType,
    DataProvider, LayerGroupType,
    ExportLayerRequest
)
from frontend.api_views.layers import (
    LayerAPI,
    UploadLayerAPI,
    PMTileLayerAPI,
    SubmitExportLayerRequest,
    ExportLayerRequestStatus,
    DownloadLayerExportedFile
)


class LayerAPITest(BaseAPIViewTest):
    """Layer api test case."""

    fixtures = [
        '1.layer_group_type.json',
        '2.data_provider.json',
        '3.input_layer.json'
    ]

    def setUp(self):
        """Setup for tests."""
        super().setUp()
        # create layer
        self.layer = Layer.objects.create(
            created_by=self.user,
            is_ready=True
        )
        # create InputLayer
        self.input_layer = InputLayer.objects.create(
            uuid=self.layer.unique_id,
            name=str(self.layer.unique_id),
            data_provider=DataProvider.objects.get(name='User defined'),
            group=LayerGroupType.objects.get(name='user-defined'),
            created_by=self.user,
            updated_by=self.user
        )
        # create LayerUpload
        self.layer_upload = LayerUpload.objects.create(
            created_by=self.user, layer=self.layer
        )

    def tearDown(self):
        """Clean up after tests."""
        self.layer_upload.delete_folder()

    def test_get_layer_list(self):
        """Test get layer list."""
        view = LayerAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:layer')
        )
        request.user = self.superuser
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            InputLayer.objects.exclude(
                url__isnull=True
            ).count(),
            len(response.data)
        )
        self._assert_keys_in_dict(
            response.data[0],
            ['id', 'name', 'url', 'type', 'group', 'metadata']
        )

    def test_upload_layer_no_auth(self):
        """Test upload without auth."""
        view = UploadLayerAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:upload-layer')
        )
        response = view(request)
        self.assertEqual(response.status_code, 401)

    def _get_request(self, file_path, file_name=None):
        """Get request for test upload."""
        with open(file_path, 'rb') as data:
            file = SimpleUploadedFile(
                content=data.read(),
                name=file_name if file_name else data.name,
                content_type='multipart/form-data'
            )
        request = self.factory.post(
            reverse('frontend-api:upload-layer'),
            data={
                'file': file
            }
        )
        request.user = self.superuser
        return request

    def _check_error(
            self, response, error_detail, status_code = 400,
            error_key='Invalid uploaded file'
        ):
        """Check for error in the response."""
        self.assertEqual(response.status_code, status_code)
        self.assertIn(error_key, response.data)
        self.assertEqual(str(response.data[error_key]), error_detail)

    @mock.patch('layers.tasks.import_layer.import_layer.delay')
    def test_upload_layer(self, mock_import_layer):
        """Test upload layer."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'polygons.zip'
        )
        request = self._get_request(file_path)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('id', response.data)
        self.assertIn('layer_id', response.data)
        self.assertIn('upload_id', response.data)
        input_layer = InputLayer.objects.filter(
            uuid=response.data['id']
        ).first()
        self.assertTrue(input_layer)
        self.assertEqual(input_layer.layer_type, InputLayerType.VECTOR)
        self.assertEqual(input_layer.group.name, 'user-defined')
        self.assertEqual(input_layer.name, 'polygons.zip')
        mock_import_layer.assert_called_once()

    def test_fetch_shp_for_pmtile(self):
        """Test GET for PMTileLayerAPI."""
        view = PMTileLayerAPI.as_view()
        self.layer_upload.emptying_folder()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'polygons.zip'
        )
        with open(file_path, 'rb') as data:
            FileSystemStorage(
                location=self.layer_upload.folder
            ).save('polygons.zip', data)

        request = self.factory.get(
            reverse('frontend-api:pmtile-layer', kwargs={
                'upload_id': self.layer_upload.id
            })
        )
        request.user = self.superuser
        response = view(request, **{
            'upload_id': self.layer_upload.id
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('Content-Disposition', response.headers)

    def test_upload_pmtile(self):
        """Test GET for PMTileLayerAPI."""
        view = PMTileLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'polygons.zip'
        )
        with open(file_path, 'rb') as data:
            file = SimpleUploadedFile(
                content=data.read(),
                name=data.name,
                content_type='multipart/form-data'
            )
        request = self.factory.post(
            reverse('frontend-api:pmtile-layer', kwargs={
                'upload_id': self.layer_upload.id
            }),
            data={
                'file': file
            }
        )
        request.user = self.superuser
        response = view(request, **{
            'upload_id': self.layer_upload.id
        })
        self.assertEqual(response.status_code, 200)
        self.input_layer.refresh_from_db()
        self.assertIsNotNone(self.input_layer.url)
        self.layer.refresh_from_db()
        self.assertIsNotNone(self.layer.pmtile)

    def test_upload_invalid_type(self):
        """Test upload with invalid file type."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'polygons.zip'
        )
        request = self._get_request(file_path, 'test.txt')
        response = view(request)
        self._check_error(
            response,
            'Unrecognized file type! '
            'Please upload one of the supported format: '
            '.json, .geojson, .zip, .gpkg, .kml',
            400
        )

    def test_upload_invalid_shapefile(self):
        """Test upload with invalid shapefile."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'shp_no_shp.zip')
        request = self._get_request(file_path)
        response = view(request)
        self._check_error(
            response,
            'Missing required file(s) inside zip file: \n- shp_1_1.shp',
            400
        )

    def test_upload_invalid_crs(self):
        """Test upload with invalid crs."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'shp_3857.zip')
        request = self._get_request(file_path)
        response = view(request)
        self._check_error(
            response,
            'Incorrect CRS type: epsg:3857! Please use epsg:4326 (WGS84)!',
            400
        )
    
    @mock.patch('frontend.api_views.layers.list_layers', return_value=[])
    def test_upload_layer_no_layers(self, mock_list_layers):
        """Test upload layer with no layers in the file."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'polygons.zip'
        )
        request = self._get_request(file_path)
        response = view(request)
        self._check_error(
            response,
            'The uploaded file must have at least 1 layer!',
            400
        )
        mock_list_layers.assert_called_once()

    def test_upload_layer_no_features(self):
        """Test upload layer with no features in the file."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'empty_test.gpkg'
        )
        request = self._get_request(file_path)
        response = view(request)
        self._check_error(
            response,
            'The uploaded file does not have any feature!',
            400
        )

    @mock.patch('layers.tasks.import_layer.import_layer.delay')
    def test_upload_layer_gpkg(self, mock_import_layer):
        """Test upload layer using gpkg."""
        view = UploadLayerAPI.as_view()
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'data_test.gpkg'
        )
        request = self._get_request(file_path)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('id', response.data)
        self.assertIn('layer_id', response.data)
        self.assertIn('upload_id', response.data)
        input_layer = InputLayer.objects.filter(
            uuid=response.data['id']
        ).first()
        self.assertTrue(input_layer)
        self.assertEqual(input_layer.layer_type, InputLayerType.VECTOR)
        self.assertEqual(input_layer.group.name, 'user-defined')
        self.assertEqual(input_layer.name, 'data_test.gpkg')
        mock_import_layer.assert_called_once()
        
    @mock.patch('layers.tasks.export_layer.process_export_request.delay')
    def test_submit_export_layer_request(self, mock_process_export_request):
        """Test submit export layer request."""
        view = SubmitExportLayerRequest.as_view()
        request = self.factory.post(
            reverse('frontend-api:submit-export-layer-request'),
            data={
                'format': 'geojson',
                'layers': [str(self.input_layer.uuid)]
            },
            format='json'
        )
        request.user = self.superuser
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('request_id', response.data)
        self.assertIn('format', response.data)
        self.assertIn('start_datetime', response.data)
        self.assertIn('end_datetime', response.data)
        self.assertIn('status', response.data)
        self.assertIn('notes', response.data)
        mock_process_export_request.assert_called_once()

    def test_submit_export_layer_request_no_format(self):
        """Test submit export layer request without format."""
        view = SubmitExportLayerRequest.as_view()
        request = self.factory.post(
            reverse('frontend-api:submit-export-layer-request'),
            data={
                'layers': [str(self.input_layer.uuid)]
            },
            format='json'
        )
        request.user = self.superuser
        response = view(request)
        self._check_error(
            response,
            'Format is mandatory!',
            400,
            'Invalid export request'
        )

    def test_submit_export_layer_request_invalid_format(self):
        """Test submit export layer request with invalid format."""
        view = SubmitExportLayerRequest.as_view()
        request = self.factory.post(
            reverse('frontend-api:submit-export-layer-request'),
            data={
                'format': 'invalid_format',
                'layers': [str(self.input_layer.uuid)]
            },
            format='json'
        )
        request.user = self.superuser
        response = view(request)
        self._check_error(
            response,
            'Unrecognized format invalid_format!',
            400,
            'Invalid export request'
        )

    def test_submit_export_layer_request_no_layers(self):
        """Test submit export layer request without layers."""
        view = SubmitExportLayerRequest.as_view()
        request = self.factory.post(
            reverse('frontend-api:submit-export-layer-request'),
            data={
                'format': 'geojson'
            },
            format='json'
        )
        request.user = self.superuser
        response = view(request)
        self._check_error(
            response,
            'At least 1 layer must be selected!',
            400,
            'Invalid export request'
        )

    def test_submit_export_layer_request_invalid_uuid(self):
        """Test submit export layer request with invalid UUID."""
        view = SubmitExportLayerRequest.as_view()
        request = self.factory.post(
            reverse('frontend-api:submit-export-layer-request'),
            data={
                'format': 'geojson',
                'layers': ['invalid_uuid']
            },
            format='json'
        )
        request.user = self.superuser
        response = view(request)
        self._check_error(
            response,
            'Invalid UUID format: invalid_uuid',
            400,
            'Invalid export request'
        )

    def test_export_layer_request_status(self):
        """Test fetch status of export layer request."""
        view = ExportLayerRequestStatus.as_view()
        export_request = ExportLayerRequest.objects.create(
            requested_by=self.user,
            format='geojson'
        )
        export_request.layers.set([self.input_layer])

        request = self.factory.get(
            reverse('frontend-api:status-export-layer-request', kwargs={
                'request_id': export_request.id
            })
        )
        request.user = self.superuser
        response = view(request, **{
            'request_id': export_request.id
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('request_id', response.data)
        self.assertIn('format', response.data)
        self.assertIn('start_datetime', response.data)
        self.assertIn('end_datetime', response.data)
        self.assertIn('status', response.data)
        self.assertIn('notes', response.data)

    def test_download_layer_exported_file(self):
        """Test download the exported file."""
        view = DownloadLayerExportedFile.as_view()
        export_request = ExportLayerRequest.objects.create(
            requested_by=self.user,
            format='geojson',
            status=TaskStatus.COMPLETED
        )
        export_request.layers.set([self.input_layer])
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'exported_file.geojson'
        )
        expected_filename = f'{str(uuid.uuid4())}.geojson'
        with open(file_path, 'rb') as data:
            export_request.file.save(expected_filename, data, save=True)
        
        request = self.factory.get(
            reverse('frontend-api:download-exported-layer-file', kwargs={
                'request_id': export_request.id
            })
        )
        request.user = self.superuser
        response = view(request, **{
            'request_id': export_request.id
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Content-Disposition'],
            f'attachment; filename="{expected_filename}"'
        )

    def test_download_layer_exported_file_not_completed(self):
        """Test download the exported file when task is not completed."""
        view = DownloadLayerExportedFile.as_view()
        export_request = ExportLayerRequest.objects.create(
            requested_by=self.user,
            format='geojson',
            status=TaskStatus.PENDING
        )
        export_request.layers.set([self.input_layer])

        request = self.factory.get(
            reverse('frontend-api:download-exported-layer-file', kwargs={
                'request_id': export_request.id
            })
        )
        request.user = self.superuser
        response = view(request, **{
            'request_id': export_request.id
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data, 'Export task is not finished!')

    def test_download_layer_exported_file_missing(self):
        """Test download the exported file when file is missing."""
        view = DownloadLayerExportedFile.as_view()
        export_request = ExportLayerRequest.objects.create(
            requested_by=self.user,
            format='geojson',
            status=TaskStatus.COMPLETED
        )
        export_request.layers.set([self.input_layer])

        request = self.factory.get(
            reverse('frontend-api:download-exported-layer-file', kwargs={
                'request_id': export_request.id
            })
        )
        request.user = self.superuser
        response = view(request, **{
            'request_id': export_request.id
        })
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data, 'Missing exported file!')
