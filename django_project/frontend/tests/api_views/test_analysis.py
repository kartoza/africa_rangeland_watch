# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Analysis API.
"""
import uuid
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch, MagicMock

from core.tests.common import BaseAPIViewTest
from frontend.api_views.analysis import AnalysisAPI, FetchAnalysisTaskAPI
from analysis.analysis import InputLayer, AnalysisResultsCache
from analysis.runner import AnalysisRunner
from analysis.models import AnalysisTask
from core.models import TaskStatus


class AnalysisAPITest(BaseAPIViewTest):
    """Analysis api test case."""

    fixtures = [
        '1.project.json',
        '2.landscape.json',
        '4.indicator.json',
    ]

    @patch('analysis.runner.run_analysis')
    @patch('analysis.runner.initialize_engine_analysis')
    def test_temporal_analysis(self, mock_init_gee, mock_analysis):
        """Test temporal analysis list."""
        def side_effect_func(*args, **kwargs):
            """Side effect function."""
        mock_analysis.return_value = [
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
                        "id": year,
                        "properties": {
                            "Bare ground": 66.98364803153024,
                            "EVI": 0.25931378422899043,
                            "NDVI": 0.18172535940724382,
                            "Name": "BNP western polygon",
                            "date": timezone.now().replace(year=year).timestamp(),
                            "year": year
                        }
                    } for year in [2017, 2019, 2020]
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
                        "id": year,
                        "properties": {
                            "Bare ground": 66.98364803153024,
                            "EVI": 0.25931378422899043,
                            "NDVI": 0.18172535940724382,
                            "Name": "BNP western polygon",
                            "date": timezone.now().replace(year=year).timestamp(),
                            "year": year
                        }
                    } for year in [2017, 2019, 2020]
                ]
            }
        ]
        mock_init_gee.return_value = None

        payload = {
            'locations': [{
                'lat': 0,
                'lon': 0,
            }],
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

        runner = AnalysisRunner()
        results = runner.run(payload)
        self.assertEqual(
            len(results),
            2
        )
        self.assertEqual(
            len(results[0]['features']),
            3
        )
        self.assertEqual(
            len(results[0]['statistics']),
            3
        )
        self.assertEqual(
            list(results[0]['statistics'][2019].keys()),
            ['BNP western polygon']
        )
        self.assertEqual(
            results[0]['features'][0]['properties']['year'],
            2017
        )
        self.assertEqual(
            results[0]['features'][-1]['properties']['year'],
            2020
        )

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.get_rel_diff')
    @patch('uuid.uuid4')
    @patch.object(InputLayer, 'get_countries')
    @patch.object(InputLayer, 'get_spatial_layer_dict')
    @patch('analysis.runner.spatial_get_date_filter')
    @patch('analysis.runner.validate_spatial_date_range_filter')
    @patch('core.models.Preferences.load')
    def test_spatial_analysis_without_locations(self, mock_preferences_load, mock_validate_filter, mock_date_filter, mock_get_spatial_layer_dict, mock_get_countries, mock_uuid4, mock_get_rel_diff, mock_init_gee):
        """Test spatial analysis without locations (returns raster layer)."""
        # Create a mock object for getMapId return value
        mocked_uuid = uuid.UUID("12345678-1234-5678-1234-567812345678")
        mock_uuid4.return_value = mocked_uuid

        mock_get_map_id = MagicMock()
        mock_get_map_id.getMapId.return_value = {
            'tile_fetcher': MagicMock(url_format='http://fake-map-url')
        }

        # Set up mocks
        mock_get_rel_diff.return_value = mock_get_map_id
        mock_init_gee.return_value = None
        mock_date_filter.return_value = ('2018-01-01', '2021-12-31')
        mock_validate_filter.return_value = (True, '2015-01-01', '2023-12-31')
        
        # Mock preferences
        mock_preferences = MagicMock()
        mock_preferences.result_cache_ttl = 3600
        mock_preferences_load.return_value = mock_preferences

        payload = {
            "period": {"year": 2018},
            "variable": "NDVI",
            "landscape": "Namakwa",
            "locations": None,
            "custom_geom": None,
            "analysisType": "Spatial",
            "baselineEndDate": None,
            "reference_layer": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "id": "NjN19eVvFKfnputCj6zS57CacXr9WzCQ",
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [18.14324631337908, -30.075535138916138],
                                    [18.30333280891375, -30.089002740044222],
                                    [18.185491360811454, -30.14477754456029],
                                    [18.14324631337908, -30.075535138916138]
                                ]
                            ]
                        },
                        "properties": {"id": "NjN19eVvFKfnputCj6zS57CacXr9WzCQ"}
                    }
                ]
            },
            "comparisonPeriod": {"year": 2021},
            "baselineStartDate": None,
            "reference_layer_id": "NjN19eVvFKfnputCj6zS57CacXr9WzCQ",
            "temporalResolution": "Annual",
            "userDefinedFeatureId": None,
            "userDefinedFeatureName": None
        }

        # Check no cache before
        self.assertFalse(AnalysisResultsCache.objects.exists())

        runner = AnalysisRunner()
        results = runner.run(payload)

        expected_results = {
            "group": "spatial_analysis",
            "id": "spatial_analysis_rel_diff",
            "metadata": {
                "colors": ["#f9837b", "#fffcb9", "#fffcb9", "#32c2c8"],
                "maxValue": 25,
                "minValue": -25,
                "opacity": 0.7,
            },
            "name": "% difference in NDVI",
            "style": None,
            "type": "raster",
            "url": "http://fake-map-url",
            "uuid": "12345678-1234-5678-1234-567812345678",
        }
        
        # The actual result should be wrapped in spatial/temporal structure
        self.assertEqual(results['spatial']['results'], expected_results)
        self.assertEqual(results['temporal']['results'], {})

        # Check cache was created
        self.assertTrue(AnalysisResultsCache.objects.exists())

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.run_analysis')
    @patch('analysis.runner.spatial_get_date_filter')
    @patch('analysis.runner.validate_spatial_date_range_filter')
    def test_spatial_analysis_with_locations(self, mock_validate_filter, mock_date_filter, mock_run_analysis, mock_init_gee):
        """Test spatial analysis with locations (returns spatial and temporal results)."""
        # Set up mocks
        mock_init_gee.return_value = None
        mock_date_filter.return_value = ('2018-01-01', '2021-12-31')
        mock_validate_filter.return_value = (True, '2015-01-01', '2023-12-31')
        
        # Mock spatial analysis results
        mock_spatial_results = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": None,
                    "properties": {
                        "Bare ground": 45.2,
                        "EVI": 0.35,
                        "NDVI": 0.42,
                        "Name": "Rooifontein",
                        "year": 2018
                    }
                }
            ]
        }
        
        # Mock temporal analysis results
        mock_temporal_results = [
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": None,
                        "properties": {
                            "Bare ground": 45.2,
                            "EVI": 0.35,
                            "NDVI": 0.42,
                            "Name": "Rooifontein",
                            "year": 2018
                        }
                    }
                ],
                "statistics": {
                    2018: {
                        "Rooifontein": {
                            "Bare ground": {"min": 45.2, "max": 45.2, "mean": 45.2},
                            "EVI": {"min": 0.35, "max": 0.35, "mean": 0.35},
                            "NDVI": {"min": 0.42, "max": 0.42, "mean": 0.42}
                        }
                    }
                }
            }
        ]
        
        mock_run_analysis.return_value = mock_spatial_results

        payload = {
            "period": {"year": 2018},
            "variable": "NDVI",
            "landscape": "Namakwa",
            "locations": [
                {
                    "lat": -30.117855709037052,
                    "lon": 18.13657604273186,
                    "community": "00000000000000000065",
                    "communityName": "Rooifontein",
                    "communityFeatureId": 473
                },
                {
                    "lat": -30.26007360780943,
                    "lon": 18.161033701771657,
                    "community": "0000000000000000005c",
                    "communityName": "Nourivier",
                    "communityFeatureId": 464
                }
            ],
            "custom_geom": None,
            "analysisType": "Spatial",
            "baselineEndDate": None,
            "reference_layer": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "id": "NjN19eVvFKfnputCj6zS57CacXr9WzCQ",
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [18.14324631337908, -30.075535138916138],
                                    [18.30333280891375, -30.089002740044222],
                                    [18.185491360811454, -30.14477754456029],
                                    [18.14324631337908, -30.075535138916138]
                                ]
                            ]
                        },
                        "properties": {"id": "NjN19eVvFKfnputCj6zS57CacXr9WzCQ"}
                    }
                ]
            },
            "comparisonPeriod": {"year": 2021, "month": None, "quarter": None},
            "baselineStartDate": None,
            "reference_layer_id": "NjN19eVvFKfnputCj6zS57CacXr9WzCQ",
            "temporalResolution": "Annual",
            "userDefinedFeatureId": None,
            "userDefinedFeatureName": None
        }

        # Mock the temporal analysis method
        with patch.object(AnalysisRunner, 'run_temporal_analysis', return_value=mock_temporal_results):
            runner = AnalysisRunner()
            results = runner.run(payload)

            # Verify the structure of results
            self.assertIn('spatial', results)
            self.assertIn('temporal', results)
            self.assertIn('results', results['spatial'])
            self.assertIn('results', results['temporal'])
            
            # Verify spatial results
            self.assertEqual(results['spatial']['results'], mock_spatial_results)
            
            # Verify temporal results
            self.assertEqual(results['temporal']['results'], mock_temporal_results)
            
            # Verify that run_analysis was called twice (once for spatial, once for temporal via ThreadPoolExecutor)
            self.assertEqual(mock_run_analysis.call_count, 1)

    @patch('analysis.runner.AnalysisRunner.get_reference_layer_geom')
    def test_get_reference_layer_geom_none(self, mock_get_reference_layer_geom):
        """Test get_reference_layer_geom method when geom is None."""
        mock_get_reference_layer_geom.return_value = None

        view = AnalysisAPI.as_view()

        payload = {
            "period": {
                "year": 2015,
                "quarter": 1
            },
            'locations': None,
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
                            [33.130976011125426, -22.754645737587296],
                            [33.13474680471998, -22.75802902557068],
                            [33.12944731101908, -22.757465150059744],
                            [33.130976011125426, -22.754645737587296]
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

        request = self.factory.post(
            reverse('frontend-api:analysis'),
            payload,
            format='json'
        )
        request.user = self.superuser
        response = view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid reference_layer with id', response.data['error'])

    @patch("analysis.tasks.run_analysis_task.delay")
    @patch("analysis.models.AnalysisTask.objects.create")
    def test_post_analysis_task_creation(self, mock_create_task, mock_run_task):
        """Test POST method for creating an analysis task."""
        mock_create_task.return_value = MagicMock(
            id=1,
            created_at=timezone.now(),
            save=MagicMock()
        )
        mock_run_task.return_value = MagicMock(id="mock-task-id")

        payload = {
            'locations': [{
                'lat': 0,
                'lon': 0,
            }],
            "analysisType": "Baseline",
            "landscape": "1",
            "variable": "NDVI",
            "temporalResolution": "Annual",
            "period": {"year": "2015", "quarter": "1"},
        }

        view = AnalysisAPI.as_view()
        request = self.factory.post(
            reverse("frontend-api:analysis"),
            payload,
            format="json"
        )
        request.user = self.superuser

        response = view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], TaskStatus.PENDING)
        self.assertEqual(response.data["task_id"], 1)
        self.assertFalse(response.data["is_cached"])
        mock_create_task.assert_called_once_with(
            analysis_inputs=payload,
            submitted_by=self.superuser
        )
        mock_run_task.assert_called_once_with(1)

    @patch("analysis.tasks.run_analysis_task.delay")
    def test_post_invalid_analysis_type(self, mock_run_task):
        """Test POST method with an invalid analysis type."""
        payload = {
            'locations': [{
                'lat': 0,
                'lon': 0,
            }],
            "analysisType": "InvalidType",
            "landscape": "1",
            "variable": "NDVI",
            "temporalResolution": "Annual",
            "period": {"year": "2015", "quarter": "1"},
        }

        view = AnalysisAPI.as_view()
        request = self.factory.post(
            reverse("frontend-api:analysis"),
            payload,
            format="json"
        )
        request.user = self.superuser

        response = view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid analysis type", response.data["error"])
        mock_run_task.assert_not_called()

    @patch("analysis.tasks.run_analysis_task.delay")
    @patch("analysis.models.AnalysisTask.objects.create")
    def test_post_spatial_analysis_validation(self, mock_create_task, mock_run_task):
        """Test POST method with spatial analysis validation failure."""
        mock_create_task.return_value = MagicMock(
            id=1,
            created_at=timezone.now(),
            save=MagicMock()
        )

        payload = {
            'locations': [],
            "analysisType": "Spatial",
            "landscape": "1",
            "variable": "NDVI",
            "temporalResolution": "Annual",
            "period": {"year": "2015", "quarter": "1"},
            "reference_layer": {},  # Invalid reference layer
        }

        view = AnalysisAPI.as_view()
        request = self.factory.post(
            reverse("frontend-api:analysis"),
            payload,
            format="json"
        )
        request.user = self.superuser

        response = view(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid reference_layer with id", response.data["error"])
        mock_create_task.assert_not_called()
        mock_run_task.assert_not_called()


class FetchAnalysisTaskAPITest(BaseAPIViewTest):
    """FetchAnalysisTaskAPI test case."""

    def setUp(self):
        """Set up test data."""
        super().setUp()
        self.analysis_task = AnalysisTask.objects.create(
            analysis_inputs={
                "analysisType": "Spatial",
                "variable": "EVI",
                "period": {"year": 2020, "quarter": 1},
            },
            submitted_by=self.superuser,
            status=TaskStatus.PENDING,
        )

    def test_fetch_analysis_task_completed(self):
        """Test fetching a completed analysis task."""
        self.analysis_task.status = TaskStatus.COMPLETED
        self.analysis_task.result = {"key": "value"}
        self.analysis_task.save()

        url = reverse(
            "frontend-api:fetch-analysis-task",
            kwargs={"task_id": self.analysis_task.id}
        )
        request = self.factory.get(url)
        request.user = self.superuser

        view = FetchAnalysisTaskAPI.as_view()
        response = view(request, task_id=self.analysis_task.id)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], TaskStatus.COMPLETED)
        self.assertEqual(response.data["results"], {"key": "value"})

    def test_fetch_analysis_task_pending(self):
        """Test fetching a pending analysis task."""
        url = reverse(
            "frontend-api:fetch-analysis-task",
            kwargs={"task_id": self.analysis_task.id}
        )
        request = self.factory.get(url)
        request.user = self.superuser

        view = FetchAnalysisTaskAPI.as_view()
        response = view(request, task_id=self.analysis_task.id)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], TaskStatus.PENDING)
        self.assertIsNone(response.data["results"])

    def test_fetch_analysis_task_not_found(self):
        """Test fetching a non-existent analysis task."""
        url = reverse(
            "frontend-api:fetch-analysis-task",
            kwargs={"task_id": 9999}
        )
        request = self.factory.get(url)
        request.user = self.superuser

        view = FetchAnalysisTaskAPI.as_view()
        response = view(request, task_id=9999)

        self.assertEqual(response.status_code, 404)
        self.assertIn("Task not found", response.data["error"])

    @patch("analysis.models.AnalysisTask.objects.get")
    def test_fetch_analysis_task_error(self, mock_get):
        """Test fetching an analysis task with an error."""
        mock_get.side_effect = Exception("Unexpected error")

        url = reverse(
            "frontend-api:fetch-analysis-task",
            kwargs={"task_id": self.analysis_task.id}
        )
        request = self.factory.get(url)
        request.user = self.superuser

        view = FetchAnalysisTaskAPI.as_view()
        with self.assertRaises(Exception):
            view(request, task_id=self.analysis_task.id)
