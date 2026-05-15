# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Trends.Earth LDN Data.
"""
import ee

from analysis.models import GEEAsset
from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class TrendsEarthGenerator(BaseLayerGenerator):
    """Layer Generator for Trends.Earth Land Degradation Neutrality."""

    def _generate(self):
        """Generate layers from Trends.Earth LDN asset."""
        countries = self.get_countries()

        ldn_image = ee.Image(
            GEEAsset.fetch_asset_source('trendsearth_ldn')
        ).select(
            'sdg_indicator_15_3_1_for_baseline_2000_2015'
        ).clipToCollection(countries)

        ldn_layer = InputLayer.objects.get(
            name='Land Degradation Neutrality (SDG Indicator 15.3.1 for baseline) 2000-2015',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                ldn_layer,
                ldn_image.getMapId(
                    self.metadata_to_vis_params(ldn_layer)
                )['tile_fetcher'].url_format
            )
        ]
