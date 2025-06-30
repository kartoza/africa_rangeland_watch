# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for LiveStock Data.
"""

import ee
import logging

from analysis.models import GEEAsset
from layers.models import InputLayer, DataProvider
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


logger = logging.getLogger(__name__)


class LiveStockGenerator(BaseLayerGenerator):
    """Layer Generator for LiveStock Baseline."""

    def get_provider(self):
        """Get GEE Data Provider"""
        return DataProvider.objects.get(
            name='FAO'
        )

    def _get_asset_key(self, animal_name):
        asset_key = animal_name.lower().replace(' ', '_')
        return f'livestock_{asset_key}_2020'

    def _generate(self):
        """Generate layers from fire frequency asset."""
        # fetch countries
        countries = self.get_countries()

        # get InputLayer for LiveStock
        livestock_layers = InputLayer.objects.filter(
            data_provider=self.get_provider()
        ).order_by('name')

        results = []
        for livestock_layer in livestock_layers:
            animal = livestock_layer.metadata.get('species')
            if animal is None:
                # If no species is specified, skip this layer
                logger.warning(
                    f"Skipping layer {livestock_layer.name} as "
                    "it has no species specified."
                )
                continue
            # Import pre-exported livestock map
            asset_key = self._get_asset_key(animal)
            livestock_map = ee.Image(
                GEEAsset.fetch_asset_source(asset_key)
            ).clipToCollection(countries)

            # Get the map ID for the layer
            map_id = livestock_map.getMapId(
                self.metadata_to_vis_params(livestock_layer)
            )['tile_fetcher'].url_format

            results.append(
                LayerCacheResult(livestock_layer, map_id)
            )

        return results
