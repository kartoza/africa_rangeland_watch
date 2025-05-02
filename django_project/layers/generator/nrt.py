# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Near-Real Time Layers with PMTiles support.
"""
import logging
import ee

from analysis.models import Landscape
from analysis.analysis import get_nrt_sentinel
from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult

logger = logging.getLogger(__name__)


class NearRealTimeGenerator(BaseLayerGenerator):
    """Layer Generator for Near-Real Time Layers."""

    DEFAULT_MONTHS = 2

    def _to_ee_polygon(self, landscape: Landscape):
        """Convert landscape polygon to EE Polygon."""
        polygon_coords = list(landscape.bbox.coords[0])
        return ee.Geometry.Polygon(polygon_coords)

    def _pmtiles_url(self, layer_name: str, landscape_id: str) -> str:
        """Generate PMTiles URL for a given layer and landscape."""
        safe_name = layer_name.lower().replace(' ', '_')
        return f'/media/pmtiles/{safe_name}_{landscape_id}.pmtiles'

    def _generate_evi_layer(self, nrt_img, landscape: Landscape):
        try:
            evi_layer = InputLayer.objects.get(
                name='EVI',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            return LayerCacheResult(
                evi_layer,
                self._pmtiles_url('evi', landscape.id),
                str(landscape.id)
            )
        except Exception as ex:
            logger.error(f'_generate_evi_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_ndvi_layer(self, nrt_img, landscape: Landscape):
        try:
            ndvi_layer = InputLayer.objects.get(
                name='NDVI',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            return LayerCacheResult(
                ndvi_layer,
                self._pmtiles_url('ndvi', landscape.id),
                str(landscape.id)
            )
        except Exception as ex:
            logger.error(f'_generate_ndvi_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_bare_ground_layer(self, nrt_img, aoi, landscape: Landscape):
        try:
            InputLayer.objects.get(
                name='Bare ground cover',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            return LayerCacheResult(
                InputLayer.objects.get(
                    name='Bare ground cover',
                    data_provider=self.get_provider(),
                    group__name='near-real-time'
                ),
                self._pmtiles_url('bare_ground_cover', landscape.id),
                str(landscape.id)
            )
        except Exception as ex:
            logger.error(f'_generate_bare_ground_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_grass_layer(self, nrt_img, aoi, landscape: Landscape):
        try:
            InputLayer.objects.get(
                name='Grass cover',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            return LayerCacheResult(
                InputLayer.objects.get(
                    name='Grass cover',
                    data_provider=self.get_provider(),
                    group__name='near-real-time'
                ),
                self._pmtiles_url('grass_cover', landscape.id),
                str(landscape.id)
            )
        except Exception as ex:
            logger.error(f'_generate_grass_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_woody_layer(self, nrt_img, aoi, landscape: Landscape):
        try:
            InputLayer.objects.get(
                name='Woody plant cover',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            return LayerCacheResult(
                InputLayer.objects.get(
                    name='Woody plant cover',
                    data_provider=self.get_provider(),
                    group__name='near-real-time'
                ),
                self._pmtiles_url('woody_plant_cover', landscape.id),
                str(landscape.id)
            )
        except Exception as ex:
            logger.error(f'_generate_woody_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate(self):
        """Generate layers for Near-Real Time."""
        results = []

        for landscape in Landscape.objects.all().iterator(chunk_size=1):
            aoi = self._to_ee_polygon(landscape)
            nrt_img = get_nrt_sentinel(aoi, self.DEFAULT_MONTHS)

            evi = self._generate_evi_layer(nrt_img, landscape)
            if evi:
                results.append(evi)

            ndvi = self._generate_ndvi_layer(nrt_img, landscape)
            if ndvi:
                results.append(ndvi)

            bg = self._generate_bare_ground_layer(nrt_img, aoi, landscape)
            if bg:
                results.append(bg)

            grass = self._generate_grass_layer(nrt_img, aoi, landscape)
            if grass:
                results.append(grass)

            woody = self._generate_woody_layer(nrt_img, aoi, landscape)
            if woody:
                results.append(woody)

        return results
