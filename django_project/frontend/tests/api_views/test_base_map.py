# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for BaseMap API.
"""

from django.urls import reverse

from core.models import Preferences
from core.tests.common import BaseAPIViewTest
from frontend.models import BaseMap
from frontend.api_views.base_map import BaseMapAPI, MapConfigAPI


class BaseMapAPITest(BaseAPIViewTest):
    """Base map api test case."""

    fixtures = [
        '1.base_map.json'
    ]

    def test_get_base_map_without_auth(self):
        """Test get base map without authentication."""
        view = BaseMapAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:base-map')
        )
        response = view(request)
        self.assertEqual(response.status_code, 200)

    def test_get_base_map(self):
        """Test get base map with user."""
        view = BaseMapAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:base-map')
        )
        request.user = self.superuser
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            BaseMap.objects.count(),
            len(response.data)
        )
        self._assert_keys_in_dict(
            response.data[0],
            ['name', 'url']
        )


class MapConfigAPITest(BaseAPIViewTest):
    """Map config api test case."""

    def test_map_config(self):
        """Test fetch map config."""
        view = MapConfigAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:map-config')
        )
        request.user = self.user
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('initial_bound', response.data)
        self.assertEqual(
            response.data['initial_bound'],
            Preferences.load().map_initial_bound
        )
