# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Fire Frequency Data.
"""
import ee

from analysis.models import GEEAsset
from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class FireFrequencyGenerator(BaseLayerGenerator):
    """Layer Generator for Fire Frequency Baseline."""

    def _generate(self):
        """Generate layers from fire frequency asset."""
        # fetch countries
        countries = self.get_countries()

        # Import pre-exported fire frequency map
        fire_freq = ee.Image(
            GEEAsset.fetch_asset_source('fire_freq')
        ).divide(18)
        fire_freq = fire_freq.clipToCollection(countries)

        # Fire Frequency
        ff_layer = InputLayer.objects.get(
            name='Fire frequency 2000-2020',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                ff_layer,
                fire_freq.getMapId(
                    self.metadata_to_vis_params(ff_layer)
                )['tile_fetcher'].url_format
            )
        ]
