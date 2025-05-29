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

        payload = {
            "period": {
                "year":2015,
                "quarter":1
            },
            'locations': [],
            "variable": "EVI",
            "community": None,
            "landscape": "Bahine NP",
            "analysisType": "Spatial",
            "communityName": None,
            "reference_layer": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "feature",
                        "geometry": {
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
                        }
                    }
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
