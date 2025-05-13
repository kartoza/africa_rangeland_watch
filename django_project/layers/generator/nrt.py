# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Near-Real Time Layers.
"""
import logging
import datetime
import ee

from analysis.models import Landscape, GEEAsset
from analysis.analysis import get_nrt_sentinel, train_bgt, classify_bgt
from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


logger = logging.getLogger(__name__)


class NearRealTimeGenerator(BaseLayerGenerator):
    """Layer Generator for Near-Real Time Layers."""

    DEFAULT_MONTHS = 2
    NRT_START_DATE = '2022-06-01'

    def _to_ee_polygon(self, landscape: Landscape):
        """Convert landscape polygon to EE Polygon."""
        polygon_coords = list(landscape.bbox.coords[0])
        return ee.Geometry.Polygon(polygon_coords)

    def _generate_evi_layer(self, nrt_img, landscape: Landscape):
        """Generate EVI layer for a landscape."""
        try:
            evi_img = nrt_img.select('evi')

            evi_layer = InputLayer.objects.get(
                name='EVI',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )

            return LayerCacheResult(
                evi_layer,
                evi_img.getMapId(
                    self.metadata_to_vis_params(evi_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(
                f'_generate_evi_layer is failed on {landscape}'
            )
            logger.error(ex)
            return None

    def _generate_ndvi_layer(self, nrt_img, landscape: Landscape):
        """Generate NDVI layer for a landscape."""
        try:
            ndvi_img = nrt_img.select('ndvi')

            ndvi_layer = InputLayer.objects.get(
                name='NDVI',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )

            return LayerCacheResult(
                ndvi_layer,
                ndvi_img.getMapId(
                    self.metadata_to_vis_params(ndvi_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(
                f'_generate_ndvi_layer is failed on {landscape}'
            )
            logger.error(ex)
            return None

    def _generate_bare_ground_layer(self, nrt_img, aoi, landscape: Landscape):
        """Generate bare ground layer for a landscape."""
        # train and classify bare ground
        try:
            classifier = train_bgt(
                aoi,
                GEEAsset.fetch_asset_source('random_forest_training')
            )
            bg = classify_bgt(nrt_img, classifier).select('bare')

            bg_layer = InputLayer.objects.get(
                name='Bare ground',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )

            return LayerCacheResult(
                bg_layer,
                bg.getMapId(
                    self.metadata_to_vis_params(bg_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(
                f'_generate_bare_ground_layer is failed on {landscape}'
            )
            logger.error(ex)
            return None

    def _generate(self):
        """Generate layers for Near-Real Time."""
        results = []

        current_dt = datetime.datetime.now(datetime.UTC)
        nrt_end_dt = current_dt.date().isoformat()

        for landscape in Landscape.objects.all().iterator(chunk_size=1):
            aoi = self._to_ee_polygon(landscape)
            nrt_img = get_nrt_sentinel(
                aoi,
                self.DEFAULT_MONTHS,
                self.NRT_START_DATE,
                nrt_end_dt
            )
            evi = self._generate_evi_layer(nrt_img, landscape)
            if evi:
                results.append(evi)
            ndvi = self._generate_ndvi_layer(nrt_img, landscape)
            if ndvi:
                results.append(ndvi)
            bg = self._generate_bare_ground_layer(nrt_img, aoi, landscape)
            if bg:
                results.append(bg)

        return results
