# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Near-Real Time Layers.
"""
import logging
import datetime
import ee

from analysis.models import Landscape, GEEAsset
from analysis.analysis import (
    get_nrt_sentinel, train_bgt, classify_bgt,
    get_soil_carbon,
    get_soil_carbon_change,
    get_grazing_capacity_layer,
    calculate_firefreq
)
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
            evi_layer.metadata = {
                **(evi_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            evi_layer.save()

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
            ndvi_layer.metadata = {
                **(ndvi_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            ndvi_layer.save()

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
            bg_layer.metadata = {
                **(bg_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            bg_layer.save()

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

    def _generate_grass_cover_layer(self, nrt_img, aoi, landscape: Landscape):
        """Generate grass cover layer for a landscape."""
        try:
            classifier = train_bgt(
                aoi,
                GEEAsset.fetch_asset_source('random_forest_training')
            )
            grass = classify_bgt(nrt_img, classifier).select('grass')

            grass_layer = InputLayer.objects.get(
                name='Grass cover',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            grass_layer.metadata = {
                **(grass_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            grass_layer.save()

            return LayerCacheResult(
                grass_layer,
                grass.getMapId(
                    self.metadata_to_vis_params(grass_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(f'_generate_grass_cover_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_tree_cover_layer(self, nrt_img, aoi, landscape: Landscape):
        """Generate tree plant cover layer for a landscape."""
        try:
            classifier = train_bgt(
                aoi,
                GEEAsset.fetch_asset_source('random_forest_training')
            )
            tree = classify_bgt(nrt_img, classifier).select('tree')

            tree_layer = InputLayer.objects.get(
                name='tree plant cover',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            tree_layer.metadata = {
                **(tree_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            tree_layer.save()

            return LayerCacheResult(
                tree_layer,
                tree.getMapId(
                    self.metadata_to_vis_params(tree_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(f'_generate_tree_cover_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_fire_frequency_layer(
            self, aoi, nrt_end_dt, landscape: Landscape
    ):
        try:
            fire_layer = InputLayer.objects.get(
                name='Fire frequency',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            fire_layer.metadata = {
                **(fire_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            fire_layer.save()

            fire_img = calculate_firefreq(aoi, self.NRT_START_DATE, nrt_end_dt)

            return LayerCacheResult(
                fire_layer,
                fire_img.getMapId(
                    self.metadata_to_vis_params(fire_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(
                f'_generate_fire_frequency_layer failed on {landscape}'
            )
            logger.error(ex)
            return None

    def _generate_soil_carbon_layer(
            self, aoi, nrt_end_dt, landscape: Landscape
    ):
        try:
            soil_layer = InputLayer.objects.get(
                name='Soil Carbon',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            soil_layer.metadata = {
                **(soil_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            soil_layer.save()

            soil_img = get_soil_carbon(
                start_date=datetime.date.fromisoformat(self.NRT_START_DATE),
                end_date=datetime.date.fromisoformat(nrt_end_dt),
                clip_to_countries=False,
                aoi=aoi
            )

            return LayerCacheResult(
                soil_layer,
                soil_img.getMapId(
                    self.metadata_to_vis_params(soil_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(f'_generate_soil_carbon_layer failed on {landscape}')
            logger.error(ex)
            return None

    def _generate_grazing_capacity_layer(self, aoi, landscape: Landscape):
        try:
            grazing_layer = InputLayer.objects.get(
                name='Grazing capacity',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            grazing_layer.metadata = {
                **(grazing_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            grazing_layer.save()

            grazing_img = get_grazing_capacity_layer.clip(aoi)

            return LayerCacheResult(
                grazing_layer,
                grazing_img.getMapId(
                    self.metadata_to_vis_params(grazing_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(
                f'_generate_grazing_capacity_layer failed on {landscape}'
            )
            logger.error(ex)
            return None

    def _generate_soil_carbon_change_layer(
            self, aoi, nrt_end_dt, landscape: Landscape
    ):
        try:
            change_layer = InputLayer.objects.get(
                name='Soil Carbon change',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )
            change_layer.metadata = {
                **(change_layer.metadata or {}),
                "landscape_id": landscape.id
            }
            change_layer.save()

            change_img = get_soil_carbon_change(
                start_date=datetime.date.fromisoformat(self.NRT_START_DATE),
                end_date=datetime.date.fromisoformat(nrt_end_dt),
                clip_to_countries=False,
                aoi=aoi
            )

            return LayerCacheResult(
                change_layer,
                change_img.getMapId(
                    self.metadata_to_vis_params(change_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )
        except Exception as ex:
            logger.error(
                f'_generate_soil_carbon_change_layer failed on {landscape}'
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
            grass = self._generate_grass_cover_layer(nrt_img, aoi, landscape)
            if grass:
                results.append(grass)
            tree = self._generate_tree_cover_layer(nrt_img, aoi, landscape)
            if tree:
                results.append(tree)
            fire = self._generate_fire_frequency_layer(
                aoi, nrt_end_dt, landscape
            )
            if fire:
                results.append(fire)

            soil = self._generate_soil_carbon_layer(aoi, nrt_end_dt, landscape)
            if soil:
                results.append(soil)

            grazing = self._generate_grazing_capacity_layer(aoi, landscape)
            if grazing:
                results.append(grazing)

            soil_change = self._generate_soil_carbon_change_layer(
                aoi, nrt_end_dt, landscape
            )
            if soil_change:
                results.append(soil_change)

        return results
