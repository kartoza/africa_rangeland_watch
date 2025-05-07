from django.test import TestCase
from unittest.mock import patch
from layers.models import ExternalLayerSource, FetchHistory, DataProvider
from layers.tasks.fetch_external_layers import fetch_external_layers_task


class FetchExternalLayersTaskTests(TestCase):
    def setUp(self):
        # Create ExternalLayerSource
        self.provider = DataProvider.objects.create(
            name="Test Provider"
        )

        self.manual_source = ExternalLayerSource.objects.create(
            name="Manual Source",
            fetch_type="manual",
            slug="manual",
            frequency="manual",
            provider=self.provider,
        )

        self.automatic_source = ExternalLayerSource.objects.create(
            name="RAMONA Source",
            fetch_type="api",
            slug="ramona",
            frequency="weekly",
            provider=self.provider,
        )

    def test_fetch_task_creates_history_for_non_manual_sources(self):
        """
        Test that fetch_external_layers_task
        creates FetchHistory only for non-manual sources.
        """
        fetch_external_layers_task()

        histories = FetchHistory.objects.all()
        self.assertEqual(histories.count(), 1)
        history = histories.first()
        self.assertEqual(history.source, self.automatic_source)
        self.assertEqual(history.status, "success")

    def test_manual_sources_are_skipped(self):
        """Test that manual sources are not fetched."""
        fetch_external_layers_task()

        histories = FetchHistory.objects.all()
        source_names = [h.source.name for h in histories]
        self.assertNotIn("Manual Source", source_names)

    def test_failure_is_recorded_if_fetch_fails(self):
        with patch(
            "layers.tasks.fetch_external_layers.fetch_source_data",
            side_effect=Exception("Simulated failure")
        ):
            fetch_external_layers_task()

        histories = FetchHistory.objects.all()
        self.assertEqual(histories.count(), 1)
        history = histories.first()
        self.assertEqual(history.status, "failure")
        self.assertIn("Simulated failure", history.message)
