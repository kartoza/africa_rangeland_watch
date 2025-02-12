# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Analysis API.
"""
import uuid
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch, MagicMock

from analysis.models import Landscape
from core.tests.common import BaseAPIViewTest
from frontend.api_views.analysis import AnalysisAPI
from analysis.analysis import InputLayer, AnalysisResultsCache


class AnalysisAPITest(BaseAPIViewTest):
    """Analysis api test case."""

    fixtures = [
        '1.landscape.json'
    ]

    @patch('frontend.api_views.analysis._temporal_analysis')
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
        self.assertEqual(
            len(results[0]['features']),
            5
        )
        self.assertEqual(
            results[0]['features'][0]['properties']['year'],
            2017
        )
        self.assertEqual(
            results[0]['features'][-1]['properties']['year'],
            2020
        )

    @patch('frontend.api_views.analysis.initialize_engine_analysis')
    @patch('frontend.api_views.analysis.get_rel_diff')
    @patch('uuid.uuid4')
    @patch.object(InputLayer, 'get_countries')
    @patch.object(InputLayer, 'get_spatial_layer_dict')
    def test_spatial_analysis(self, mock_get_spatial_layer_dict, mock_get_countries, mock_uuid4, mock_get_rel_diff, mock_init_gee):
        """Test spatial analysis list."""
        # Create a mock object for getMapId return value
        mocked_uuid = uuid.UUID("12345678-1234-5678-1234-567812345678")
        mock_uuid4.return_value = mocked_uuid

        mock_get_map_id = MagicMock()
        mock_get_map_id.getMapId.return_value = {
            'tile_fetcher': MagicMock(url_format='http://fake-map-url')
        }

        # Set the return value of get_rel_diff()
        mock_get_rel_diff.return_value = mock_get_map_id
        mock_init_gee.return_value = None

        view = AnalysisAPI.as_view()

        payload = {
            "period": {
                "year":2015,
                "quarter":1
            },
            "latitude": None,
            "longitude": None,
            "variable": "EVI",
            "community": None,
            "landscape": "Bahine NP",
            "analysisType": "Spatial",
            "communityName": None,
            "reference_layer": {
                "type": "MultiPolygon", 
                "coordinates": [
                    [
                        [
                            [33.130976011125426,-22.754645737587296], 
                            [33.13474680471998,-22.75802902557068],
                            [33.12944731101908,-22.757465150059744], 
                            [33.130976011125426,-22.754645737587296]
                        ]
                    ]
                ]
            },
            "comparisonPeriod": {
                "year": [],
                "quarter": []
            },
            "communityFeatureId": None,
            "temporalResolution": "Annual"
        }

        # Check no cache before
        self.assertFalse(AnalysisResultsCache.objects.exists())

        request = self.factory.post(
            reverse('frontend-api:analysis'),
            payload,
            format='json'
        )
        request.user = self.superuser
        response = view(request)

        self.assertEqual(response.status_code, 200)
        results = response.data['results']

        expected_results = {
            "group": "spatial_analysis",
            "id": "spatial_analysis_rel_diff",
            "metadata": {
                "colors": ["#f9837b", "#fffcb9", "#fffcb9", "#32c2c8"],
                "maxValue": 25,
                "minValue": -25,
                "opacity": 0.7,
            },
            "name": "% difference in EVI",
            "style": None,
            "type": "raster",
            "url": "http://fake-map-url",
            "uuid": "12345678-1234-5678-1234-567812345678",
        }
        self.assertEqual(
            results,
            expected_results
        )

        # Check cache
        self.assertTrue(AnalysisResultsCache.objects.exists())