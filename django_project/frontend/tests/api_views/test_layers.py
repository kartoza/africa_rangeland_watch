# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Layers API.
"""

import mock
from django.test import TransactionTestCase
from django.urls import reverse
from django.core.files.storage import FileSystemStorage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from cloud_native_gis.models.layer import Layer
from cloud_native_gis.models.layer_upload import LayerUpload
from rest_framework.test import APIRequestFactory

from core.factories import UserF
from core.settings.utils import absolute_path
from core.tests.common import BaseAPIViewTest
from layers.models import (
    InputLayer, InputLayerType,
    DataProvider, LayerGroupType
)
from frontend.api_views.layers import (
    LayerAPI,
    UploadLayerAPI,
    PMTileLayerAPI,
    DataPreviewAPI
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


class DataPreviewAPITest(TransactionTestCase):

    def setUp(self):
        """Init test class."""
        self.factory = APIRequestFactory()

        # add superuser
        self.superuser = UserF.create(
            is_staff=True,
            is_superuser=True,
            is_active=True
        )

        # add normal user
        self.user = UserF.create(
            is_active=True
        )

        # create public_gis schema if not exists
        with connection.cursor() as cursor:
            cursor.execute('CREATE SCHEMA IF NOT EXISTS public_gis')

        self.layer = Layer.objects.create(
            created_by=self.user,
            is_ready=True
        )
        self.layer_upload = LayerUpload.objects.create(
            created_by=self.user, layer=self.layer
        )
        file_path = absolute_path(
            'frontend', 'tests', 'data', 'polygons_import.zip'
        )
        with open(file_path, 'rb') as data:
            FileSystemStorage(
                location=self.layer_upload.folder
            ).save(f'polygons_import.zip', data)
        self.layer_upload.save()
        self.layer_upload.import_data()

        self.layer.refresh_from_db()

    def tearDown(self):
        """Clean up after tests."""
        self.layer_upload.delete_folder()
        self.layer.delete()

    def test_data_preview_api(self):
        """Test data preview API."""
        view = DataPreviewAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:data-preview', kwargs={
                'pk': self.layer.unique_id
            }),
            data={
                'page_size': 10,
                'page': 1
            }
        )
        request.user = self.superuser
        response = view(request, pk=self.layer.unique_id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['data']), 2)
        self.assertEqual(response.data['data'][0]['id'], 1)
        self.assertEqual(response.data['data'][0]['name'], 'kenya')

    def test_data_preview_api_with_search(self):
        """Test data preview API with search."""
        view = DataPreviewAPI.as_view()

        request = self.factory.get(
            reverse('frontend-api:data-preview', kwargs={
                'pk': self.layer.unique_id
            }),
            data={
                'page_size': 10,
                'page': 1,
                'search': 'KENY'
            }
        )
        request.user = self.superuser
        response = view(request, pk=self.layer.unique_id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['id'], 1)
        self.assertEqual(response.data['data'][0]['name'], 'kenya')

    def test_data_preview_api_no_features(self):
        """Test data preview API with no features."""
        view = DataPreviewAPI.as_view()

        request = self.factory.get(
            reverse('frontend-api:data-preview', kwargs={
                'pk': self.layer.unique_id
            }),
            data={
                'page_size': 10,
                'page': 1,
                'search': 'FEATURE_NOT_FOUND'
            }
        )
        request.user = self.superuser
        response = view(request, pk=self.layer.unique_id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(len(response.data['data']), 0)
