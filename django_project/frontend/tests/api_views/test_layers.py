# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Layers API.
"""

import mock
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile

from core.settings.utils import absolute_path
from core.tests.common import BaseAPIViewTest
from layers.models import InputLayer, InputLayerType
from frontend.api_views.layers import LayerAPI, UploadLayerAPI


class LayerAPITest(BaseAPIViewTest):
    """Layer api test case."""

    fixtures = [
        '1.layer_group_type.json',
        '2.data_provider.json',
        '3.input_layer.json'
    ]

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
            InputLayer.objects.count(),
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

    @mock.patch('layers.tasks.import_layer.import_layer.delay')
    def test_upload_layer(self, mock_import_layer):
        """Test upload layer."""
        view = UploadLayerAPI.as_view()
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
            reverse('frontend-api:upload-layer'),
            data={
                'file': file
            }
        )
        request.user = self.superuser
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
