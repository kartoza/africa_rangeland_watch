# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for BaseMap API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest
from analysis.models import (
    GEEAssetType,
    Indicator, 
    UserIndicator,
    IndicatorSource,
    UserGEEAsset
)
from frontend.api_views.indicator import IndicatorAPI


class IndicatorAPITest(BaseAPIViewTest):
    """Indicator api test case."""

    fixtures = [
        '4.indicator.json'
    ]

    def run_and_check_default_indicator(self, request=None):
        """Run and check test result for default indicator"""
        view = IndicatorAPI.as_view()
        request = request or self.factory.get(
            reverse('frontend-api:indicator')
        )
        response = view(request)
        self.assertEqual(response.status_code, 200)

        item = response.data[0]
        self.assertIn('name', item)
        self.assertIn('variable', item)
        self.assertIn('analysis_types', item)
        self.assertIn('temporal_resolutions', item)
        self.assertIn('source', item)

        return response.data

    def test_get_indicator_anonymos_user(self):
        """Test get indicator API with anonymous user."""
        response_data = self.run_and_check_default_indicator()
        self.assertEqual(
            len(response_data),
            Indicator.objects.filter(
                is_active=True,
            ).count()
        )

    def test_get_indicator_auth_user_only_asset_added(self):
        """Test get indicator API with authenticated user.

        In this test, only UserGeeAsset is added. UserIndicator 
        is not configured. Hence, only default Indicator will be 
        returned.
        """

        UserGEEAsset.objects.create(
            metadata={
                "end_date": "2025-08-11", 
                "start_date": "2002-01-1",
                "band_names": ["tmax", "tmin"]
            },
            source="project/user/asset",
            type=GEEAssetType.IMAGE_COLLECTION,
            key="temperature-asset",
            created_by=self.user
        )
        request = self.factory.get(
            reverse('frontend-api:indicator')
        )
        self._force_authenticate(request, self.user)

        response_data = self.run_and_check_default_indicator(
            request
        )
        # Check only default Indicators returned
        self.assertEqual(
            len(response_data),
            Indicator.objects.filter(
                is_active=True,
            ).count()
        )

    def test_get_indicator_auth_user(self):
        """Test get indicator API with authenticated user.

        In this test, only UserGeeAsset and UserIndicator were added. 
        Hence, Indicator and UserIndicator will be returned.
        """

        user_gee = UserGEEAsset.objects.create(
            metadata={
                "end_date": "2025-08-11", 
                "start_date": "2002-01-1",
                "band_names": ["tmax", "tmin"]
            },
            source="project/user/asset",
            type=GEEAssetType.IMAGE_COLLECTION,
            key="temperature-asset",
            created_by=self.user
        )
        user_indicator = UserIndicator.objects.create(
            variable_name="Custom Temperature",
            source=IndicatorSource.OTHER,
            analysis_types=["Temporal", "Spatial", "Baseline"],
            temporal_resolutions=["Annual", "Monthly", "Quarterly"],
            metadata={
                "max": 50, 
                "min": -40, 
                "palette": ["#ADD8E6", "#008000", "#FFFF00", "#FFA500", "#FF0000", "#800080"]
            },
            config={"asset_keys": ["temperatur-asset"]},
            name="Custom Temperature",
            created_by=self.user
        )
        request = self.factory.get(
            reverse('frontend-api:indicator')
        )
        self._force_authenticate(request, self.user)

        response_data = self.run_and_check_default_indicator(
            request
        )
        # Check only default Indicators returned
        self.assertEqual(len(response_data), Indicator.objects.count() + 1)

        item = response_data[-1]
        self.assertEqual(
            item,
            {
                'name': user_indicator.name, 
                'variable': user_indicator.variable_name, 
                'analysis_types': user_indicator.analysis_types, 
                'temporal_resolutions': user_indicator.temporal_resolutions, 
                'source': user_indicator.source
            }
        )
