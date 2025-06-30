# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for BaseMap API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest
from analysis.models import Indicator, IndicatorSource
from frontend.api_views.indicator import IndicatorAPI


class IndicatorAPITest(BaseAPIViewTest):
    """Indicator api test case."""

    fixtures = [
        '4.indicator.json'
    ]

    def test_get_indicator(self):
        """Test get indicator API."""
        view = IndicatorAPI.as_view()
        request = self.factory.get(
            reverse('frontend-api:indicator')
        )
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            len(response.data),
            Indicator.objects.filter(
                source=IndicatorSource.BASE
            ).count()
        )
