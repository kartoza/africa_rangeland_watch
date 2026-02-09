# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Landsat NDWI Data.
"""
import ee

from analysis.models import GEEAsset
from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class LandsatNDWIGenerator(BaseLayerGenerator):
    """Layer Generator for NDWI Baseline."""

    def _generate(self):
        """Generate layers from Landsat NDWI asset."""
        # fetch countries
        countries = self.get_countries()

        # Get Landsat NDWI data (8-day composites)
        landsat_ndwi = ee.ImageCollection(
            GEEAsset.fetch_asset_source('landsat_ndwi')
        ).filterDate(
            '2015-01-01', '2020-01-01'
        ).select(['NDWI'])

        # NDWI baseline (median)
        ndwi_baseline = landsat_ndwi.select(
            'NDWI'
        ).median().clipToCollection(countries)

        ndwi_layer = InputLayer.objects.get(
            name='NDWI 2015-2020',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                ndwi_layer,
                ndwi_baseline.getMapId(
                    self.metadata_to_vis_params(ndwi_layer)
                )['tile_fetcher'].url_format
            )
        ]
