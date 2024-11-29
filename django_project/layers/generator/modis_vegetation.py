# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for MODIS Vegetation Data.
"""
import ee

from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class ModisVegetationGenerator(BaseLayerGenerator):
    """Layer Generator for EVI and NDVI Baseline."""

    def _generate(self):
        """Generate layers from MODIS Vegetation asset."""
        # fetch countries
        countries = self.get_countries()

        # Get MODIS vegetation data
        modis_vegetation = ee.ImageCollection(
            'MODIS/006/MOD13Q1'
        ).filterDate(
            '2016-01-01', '2020-01-01'
        ).select(
            ['NDVI', 'EVI']
        ).map(lambda i: i.divide(10000))

        # EVI
        evi_baseline = modis_vegetation.select(
            'EVI'
        ).median().clipToCollection(countries)
        evi_layer = InputLayer.objects.get(
            name='EVI 2015-2020',
            data_provider=self.get_provider()
        )

        # NDVI
        ndvi_baseline = modis_vegetation.select(
            'NDVI'
        ).median().clipToCollection(countries)
        ndvi_layer = InputLayer.objects.get(
            name='NDVI 2015-2020',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                evi_layer,
                evi_baseline.getMapId(
                    self.metadata_to_vis_params(evi_layer)
                )['tile_fetcher'].url_format
            ),
            LayerCacheResult(
                ndvi_layer,
                ndvi_baseline.getMapId(
                    self.metadata_to_vis_params(ndvi_layer)
                )['tile_fetcher'].url_format
            )
        ]
