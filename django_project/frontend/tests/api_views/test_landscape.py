# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Landscape API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest
from analysis.models import Landscape
from frontend.api_views.landscape import LandscapeAPI


class LandscapeAPITest(BaseAPIViewTest):
    """Landscape api test case."""

    fixtures = [
        '1.landscape.json'
    ]

    def test_get_landscape_list(self):
        """Test get landscape list."""
        view = LandscapeAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:landscape')
        )
        request.user = self.superuser
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Landscape.objects.count(),
            len(response.data)
        )
        item = response.data[0]
        self._assert_keys_in_dict(
            item,
            ['name', 'bbox', 'zoom']
        )
        self.assertEqual(len(item['bbox']), 4)
