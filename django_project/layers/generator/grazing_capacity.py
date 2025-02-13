# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Grazing Capacity Data.
"""
import ee

from analysis.models import GEEAsset
from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class GrazingCapacityGenerator(BaseLayerGenerator):
    """Layer Generator for Grazing Capacity Baseline."""

    def _get_masked(self):
        """Get masked layer."""
        glc_coll = ee.ImageCollection(
            GEEAsset.fetch_asset_source('globe_land30')
        )
        glc_img = glc_coll.mosaic()
        return glc_img.neq(10).And(
            glc_img.neq(60)
        ).And(
            glc_img.neq(80)
        ).And(
            glc_img.neq(100)
        ).And(
            glc_img.neq(255)
        )

    def _generate(self):
        """Generate layers from Grazing Capacity asset."""
        # fetch countries
        countries = self.get_countries()

        # get masked
        masked = self._get_masked()

        # Import pre-exported grazing capacity map
        grazing_capacity = ee.Image(
            GEEAsset.fetch_asset_source('grazing_capacity')
        )
        grazing_capacity = grazing_capacity.rename('grazingCap')
        grazing_capacity = grazing_capacity.updateMask(
            masked
        ).unmask(0).clipToCollection(countries)

        # Grazing Capacity
        gc_layer = InputLayer.objects.get(
            name='Grazing capacity 2015-2020',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                gc_layer,
                grazing_capacity.getMapId(
                    self.metadata_to_vis_params(gc_layer)
                )['tile_fetcher'].url_format
            )
        ]
