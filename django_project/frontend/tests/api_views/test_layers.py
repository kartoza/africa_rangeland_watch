# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Layers API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest
from layers.models import InputLayer
from frontend.api_views.layers import LayerAPI


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
