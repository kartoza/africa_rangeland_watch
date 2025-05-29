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
            name="WRI Source",
            fetch_type="api",
            slug="wri",
            frequency="weekly",
            provider=self.provider,
        )

    def _patch_fetch_source_data(self, **kwargs):
        """
        Convenience wrapper.
        """
        return patch(
            "layers.tasks.fetch_external_layers.fetch_source_data",
            **kwargs,
        )

    def test_fetch_task_creates_history_for_non_manual_sources(self):
        with self._patch_fetch_source_data(return_value=None):
            fetch_external_layers_task()

        histories = FetchHistory.objects.all()
        self.assertEqual(histories.count(), 1)
        history = histories.first()
        self.assertEqual(history.source, self.automatic_source)
        self.assertEqual(history.status, "success")


    def test_manual_sources_are_skipped(self):
        with self._patch_fetch_source_data(return_value=None):
            fetch_external_layers_task()

        histories = FetchHistory.objects.all()
        self.assertTrue(
            all(h.source != self.manual_source for h in histories)
        )


    def test_failure_is_recorded_if_fetch_fails(self):
        with self._patch_fetch_source_data(side_effect=Exception("Simulated failure")):
            fetch_external_layers_task()

        histories = FetchHistory.objects.all()
        self.assertEqual(histories.count(), 1)
        history = histories.first()
        self.assertEqual(history.status, "failure")
        self.assertIn("Simulated failure", history.message)
