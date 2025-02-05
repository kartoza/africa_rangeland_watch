# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Analysis API.
"""

from django.urls import reverse
from unittest.mock import patch

from analysis.models import Landscape
from core.tests.common import BaseAPIViewTest
from frontend.api_views.analysis import AnalysisAPI


class AnalysisAPITest(BaseAPIViewTest):
    """Analysis api test case."""

    fixtures = [
        '1.landscape.json'
    ]

    @patch('frontend.api_views.analysis.run_analysis')
    @patch('frontend.api_views.analysis.initialize_engine_analysis')
    def test_temporal_analysis(self, mock_init_gee, mock_analysis):
        """Test temporal analysis list."""
        def side_effect_func(*args, **kwargs):
            """Side effect function."""
            if args:
                return [
                    {'year': args[0]['Temporal']['Annual']['test']}, 
                    {'quarter': args[0]['Temporal']['Quarterly']['test']}
                ]
        mock_analysis.side_effect = side_effect_func
        mock_init_gee.return_value = None

        view = AnalysisAPI.as_view()

        payload = {
            'longitude' : 0,
            'latitude' : 0,
            'analysisType': 'Temporal',
            'landscape': '1',
            'variable': 'NDVI',
            'temporalResolution': 'Annual',
            'period': {
                'year': '2015',
                'quarter': '1'
            },
            'comparisonPeriod': {
                'year': [2019,2017,2020],
                'quarter': [2,1,3]
            }
        }
        request = self.factory.post(
            reverse('frontend-api:analysis'),
            payload,
            format='json'
        )
        request.user = self.superuser
        response = view(request)
        self.assertEqual(response.status_code, 200)
        results = response.data['results']
        self.assertEqual(
            len(results),
            3
        )
        self.assertEqual(
            results,
            [
                [{'year': 2019}, {'quarter': 2}], 
                [{'year': 2017}, {'quarter': 1}], 
                [{'year': 2020}, {'quarter': 3}]
            ]
        )
