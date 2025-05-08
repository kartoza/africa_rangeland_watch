# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Landscape API.
"""

from django.urls import reverse

from analysis.models import Landscape
from core.tests.common import BaseAPIViewTest
from frontend.api_views.landscape import LandscapeViewSet


class LandscapeAPITest(BaseAPIViewTest):
    """Landscape api test case."""

    fixtures = [
        '1.project.json',
        '2.landscape.json'
    ]

    def test_get_landscape_list(self):
        """Test get landscape list."""
        view = LandscapeViewSet.as_view({'get': 'list'})
        request = self.factory.get(
            reverse('frontend-api:landscapes-list')
        )
        request.user = self.superuser
        response = view(request)
        self.assertEqual(response.status_code, 200)
        results = response.data['results']
        self.assertEqual(
            Landscape.objects.count(),
            len(results)
        )
        item = results[0]
        self._assert_keys_in_dict(
            item,
            ['name', 'bbox', 'zoom', 'urls']
        )
        self.assertEqual(len(item['bbox']), 4)
