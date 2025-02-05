# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Analysis API.
"""

from django.urls import reverse
from django.utils import timezone
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
                year = args[2]['Temporal']['Annual']['test']
                timestamp = timezone.now().replace(year=year).timestamp()
                return [
                    {
                        "type": "FeatureCollection",
                        "columns": {
                            "Bare ground": "Float",
                            "EVI": "Float",
                            "NDVI": "Float",
                            "Name": "String",
                            "date": "Long",
                            "system:index": "String",
                            "year": "Integer"
                        },
                        "features": [
                            {
                                "type": "Feature",
                                "geometry": None,
                                "id": "4669",
                                "properties": {
                                    "Bare ground": 66.98364803153024,
                                    "EVI": 0.25931378422899043,
                                    "NDVI": 0.18172535940724382,
                                    "Name": "BNP western polygon",
                                    "date": timestamp,
                                    "year": year
                                }
                            }
                        ]
                    },
                    {
                        "type": "FeatureCollection",
                        "columns": {
                            "Bare ground": "Float",
                            "EVI": "Float",
                            "NDVI": "Float",
                            "Name": "String",
                            "date": "Long",
                            "system:index": "String",
                            "year": "Integer"
                        },
                        "features": [
                            {
                                "type": "Feature",
                                "geometry": None,
                                "id": "4669",
                                "properties": {
                                    "Bare ground": 66.98364803153024,
                                    "EVI": 0.25931378422899043,
                                    "NDVI": 0.18172535940724382,
                                    "Name": "BNP western polygon",
                                    "date": timestamp,
                                    "year": year
                                }
                            }
                        ]
                    }
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
            2
        )
        print(results[0]['features'])
        self.assertEqual(
            len(results[0]['features']),
            5
        )
        print(results[0]['features'])
        self.assertEqual(
            results[0]['features'][0]['properties']['year'],
            2017
        )
        self.assertEqual(
            results[0]['features'][-1]['properties']['year'],
            2020
        )
