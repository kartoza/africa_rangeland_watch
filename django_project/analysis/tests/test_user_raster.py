# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for run_analysis_task function.
"""
import json
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone

from analysis.factories import UserIndicatorF, UserGEEAssetF
from analysis.models import AnalysisTask, GEEAssetType, IndicatorSource
from analysis.tasks import run_analysis_task
from core.factories import UserF
from core.models import TaskStatus


class RunAnalysisTaskTest(TestCase):
    """Test case for run_analysis_task function."""

    def setUp(self):
        """Set up test data."""
        self.user = UserF()
        
        # Create UserGEEAsset for Custom Temperature
        self.gee_asset = UserGEEAssetF(
            key="temperature-asset",
            created_by=self.user,
            type=GEEAssetType.IMAGE_COLLECTION,
            source="projects/sample/temperature",
            metadata={
                "end_date": "2025-08-11",
                "start_date": "2002-01-01",
                "band_names": ["tmax", "tmin"]
            }
        )
        
        # Create UserIndicator for Custom Temperature
        self.user_indicator = UserIndicatorF(
            name="Custom Temperature",
            variable_name="Custom Temperature",
            created_by=self.user,
            source=IndicatorSource.OTHER,
            analysis_types=["Baseline", "Temporal", "Spatial"],
            temporal_resolutions=["Annual", "Monthly", "Quarterly"],
            metadata={
                "max": 50,
                "min": -40,
                "palette": ["#ADD8E6", "#008000", "#FFFF00", "#FFA500", "#FF0000", "#800080"]
            },
            config={"asset_keys": ["temperature-asset"]}
        )

    def _create_analysis_task(self, analysis_inputs):
        """Helper method to create AnalysisTask."""
        return AnalysisTask.objects.create(
            analysis_inputs=analysis_inputs,
            submitted_by=self.user,
            status=TaskStatus.PENDING
        )

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.AnalysisRunner.run_baseline_analysis')
    def test_run_baseline_analysis_task(self, mock_run_baseline, mock_init_gee):
        """Test running baseline analysis task."""
        # Mock the baseline analysis result
        mock_baseline_result = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": None,
                    "properties": {
                        "Name": "BNP north-east polygon",
                        "NDVI": 0.5,
                        "EVI": 0.3,
                        "Bare ground": 0.2
                    }
                }
            ]
        }
        mock_run_baseline.return_value = mock_baseline_result

        # Create baseline analysis inputs
        baseline_inputs = {
            "period": {
                "year": 2020,
                "month": 3,
                "quarter": None
            },
            "variable": "Custom Temperature",
            "landscape": "Bahine NP",
            "locations": [
                {
                    "lat": -22.534424094597895,
                    "lon": 33.03957026755097,
                    "community": "0000000000000000017f",
                    "communityName": "BNP north-east polygon",
                    "communityFeatureId": 1
                }
            ],
            "custom_geom": None,
            "analysisType": "Baseline",
            "baselineEndDate": "2025-08-11",
            "comparisonPeriod": {
                "year": [2021],
                "month": [8],
                "quarter": None
            },
            "baselineStartDate": "2025-01-04",
            "temporalResolution": "Monthly",
            "userDefinedFeatureId": None,
            "userDefinedFeatureName": None
        }

        # Create AnalysisTask
        task = self._create_analysis_task(baseline_inputs)
        
        # Run the task
        run_analysis_task(task.id)
        
        # Refresh task from database
        task.refresh_from_db()
        
        # Assertions
        self.assertEqual(task.status, TaskStatus.COMPLETED)
        self.assertEqual(task.result, mock_baseline_result)
        self.assertIsNone(task.error)
        self.assertIsNotNone(task.completed_at)
        
        # Verify mocks were called
        mock_run_baseline.assert_called_once()

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.AnalysisRunner.run_temporal_analysis')
    def test_run_temporal_analysis_task(self, mock_run_temporal, mock_init_gee):
        """Test running temporal analysis task."""
        # Mock the temporal analysis result
        mock_temporal_result = [
            {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": None,
                        "properties": {
                            "Name": "BNP north-east polygon",
                            "NDVI": 0.4,
                            "EVI": 0.25,
                            "year": 2020
                        }
                    }
                ]
            },
            {
                "type": "FeatureCollection", 
                "features": [
                    {
                        "type": "Feature",
                        "geometry": None,
                        "properties": {
                            "Name": "BNP north-east polygon",
                            "NDVI": 0.45,
                            "EVI": 0.28,
                            "year": 2021
                        }
                    }
                ]
            }
        ]
        mock_run_temporal.return_value = mock_temporal_result

        # Create temporal analysis inputs
        temporal_inputs = {
            "period": {
                "year": 2020,
                "month": 3,
                "quarter": None
            },
            "variable": "Custom Temperature",
            "landscape": "Bahine NP",
            "locations": [
                {
                    "lat": -22.534424094597895,
                    "lon": 33.03957026755097,
                    "community": "0000000000000000017f",
                    "communityName": "BNP north-east polygon",
                    "communityFeatureId": 1
                }
            ],
            "custom_geom": None,
            "analysisType": "Temporal",
            "baselineEndDate": None,
            "comparisonPeriod": {
                "year": [2021],
                "month": [8],
                "quarter": []
            },
            "baselineStartDate": None,
            "temporalResolution": "Monthly",
            "userDefinedFeatureId": None,
            "userDefinedFeatureName": None
        }

        # Create AnalysisTask
        task = self._create_analysis_task(temporal_inputs)
        
        # Run the task
        run_analysis_task(task.id)
        
        # Refresh task from database
        task.refresh_from_db()
        
        # Assertions
        self.assertEqual(task.status, TaskStatus.COMPLETED)
        self.assertEqual(task.result, mock_temporal_result)
        self.assertIsNone(task.error)
        self.assertIsNotNone(task.completed_at)
        
        # Verify mocks were called
        mock_run_temporal.assert_called_once()

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.AnalysisRunner.run_spatial_analysis')
    def test_run_spatial_analysis_task(self, mock_run_spatial, mock_init_gee):
        """Test running spatial analysis task."""
        # Mock the spatial analysis result
        mock_spatial_result = {
            "spatial": {
                "results": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [[[32.655666743220564, -22.770232151581155]]]
                            },
                            "properties": {
                                "Name": "Test Area",
                                "mean": 0.15
                            }
                        }
                    ]
                }
            },
            "temporal": {
                "results": {}
            }
        }
        mock_run_spatial.return_value = mock_spatial_result

        # Create spatial analysis inputs
        spatial_inputs = {
            "period": {
                "year": 2020
            },
            "variable": "Custom Temperature",
            "landscape": "Bahine NP",
            "locations": None,
            "custom_geom": None,
            "analysisType": "Spatial",
            "baselineEndDate": None,
            "reference_layer": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "id": "NB4dkirvWAwqZ2PRnqhAlXnUfIVbTXdM",
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [32.655666743220564, -22.770232151581155],
                                    [32.740281941201914, -22.787848582446287],
                                    [32.682961968375594, -22.86835184292579],
                                    [32.655666743220564, -22.770232151581155]
                                ]
                            ]
                        },
                        "properties": {
                            "id": "NB4dkirvWAwqZ2PRnqhAlXnUfIVbTXdM"
                        }
                    }
                ]
            },
            "comparisonPeriod": {
                "year": 2023
            },
            "baselineStartDate": None,
            "reference_layer_id": "NB4dkirvWAwqZ2PRnqhAlXnUfIVbTXdM",
            "temporalResolution": "Annual",
            "userDefinedFeatureId": None,
            "userDefinedFeatureName": None
        }

        # Create AnalysisTask
        task = self._create_analysis_task(spatial_inputs)
        
        # Run the task
        run_analysis_task(task.id)
        
        # Refresh task from database
        task.refresh_from_db()
        
        # Assertions
        self.assertEqual(task.status, TaskStatus.COMPLETED)
        self.assertEqual(task.result, mock_spatial_result)
        self.assertIsNone(task.error)
        self.assertIsNotNone(task.completed_at)
        
        # Verify mocks were called
        mock_run_spatial.assert_called_once()

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.AnalysisRunner.run')
    def test_run_analysis_task_failure(self, mock_run, mock_init_gee):
        """Test running analysis task that fails."""
        # Mock the analysis to raise an exception
        mock_run.side_effect = ValueError("Test error message")

        # Create test analysis inputs
        test_inputs = {
            "analysisType": "Baseline",
            "variable": "Custom Temperature",
            "landscape": "Test Landscape"
        }

        # Create AnalysisTask
        task = self._create_analysis_task(test_inputs)
        
        # Run the task
        run_analysis_task(task.id)
        
        # Refresh task from database
        task.refresh_from_db()
        
        # Assertions
        self.assertEqual(task.status, TaskStatus.FAILED)
        self.assertIsNone(task.result)
        self.assertIsNotNone(task.error)
        self.assertEqual(task.error['message'], "Test error message")
        self.assertIsNotNone(task.completed_at)
        
        # Verify mocks were called
        mock_run.assert_called_once()

    def test_run_analysis_task_invalid_id(self):
        """Test running analysis task with invalid ID."""
        # Try to run task with non-existent ID
        with self.assertRaises(AnalysisTask.DoesNotExist):
            run_analysis_task(99999)

    @patch('analysis.runner.initialize_engine_analysis')
    @patch('analysis.runner.AnalysisRunner.run')
    def test_analysis_task_status_updates(self, mock_run, mock_init_gee):
        """Test that analysis task status is properly updated during execution."""
        # Mock successful analysis
        mock_result = {"test": "result"}
        mock_run.return_value = mock_result

        # Create test analysis inputs
        test_inputs = {
            "analysisType": "Baseline",
            "variable": "Custom Temperature"
        }

        # Create AnalysisTask
        task = self._create_analysis_task(test_inputs)
        initial_updated_at = task.updated_at
        
        # Verify initial status
        self.assertEqual(task.status, TaskStatus.PENDING)
        self.assertIsNone(task.completed_at)
        self.assertIsNone(task.result)
        self.assertIsNone(task.error)
        
        # Run the task
        run_analysis_task(task.id)
        
        # Refresh task from database
        task.refresh_from_db()
        
        # Verify final status
        self.assertEqual(task.status, TaskStatus.COMPLETED)
        self.assertEqual(task.result, mock_result)
        self.assertIsNone(task.error)
        self.assertIsNotNone(task.completed_at)
        self.assertGreater(task.updated_at, initial_updated_at)
