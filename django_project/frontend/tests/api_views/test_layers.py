# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Layers API.
"""

import mock
from django.urls import reverse
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from cloud_native_gis.models.layer import Layer
from cloud_native_gis.models.layer_upload import LayerUpload

from core.settings.utils import absolute_path
from core.tests.common import BaseAPIViewTest
from layers.models import (
    InputLayer, InputLayerType,
    DataProvider, LayerGroupType
)
from frontend.api_views.layers import LayerAPI, UploadLayerAPI, PMTileLayerAPI


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
            'Unrecognized file type! Please upload the zip of shapefile!',
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
