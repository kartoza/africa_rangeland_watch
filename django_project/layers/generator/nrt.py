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
    InputLayer as BaseInputLayer,
    get_nrt_sentinel, train_bgt, classify_bgt,
    calculate_grazing_capacity,
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

    def _generate_fire_frequency_layer(self, aoi, landscape):
        ff_global = ee.Image(
            GEEAsset.fetch_asset_source('fire_freq')
        ).divide(18).rename('fireFreq')

        fire_img = ff_global.clip(aoi)

        ff_layer = InputLayer.objects.get(
            name='Fire frequency',
            data_provider=self.get_provider(),
            group__name='near-real-time'
        )

        return LayerCacheResult(
            ff_layer,
            fire_img.getMapId(
                self.metadata_to_vis_params(ff_layer)
            )['tile_fetcher'].url_format,
            f'{landscape.id}'
        )

    def _generate_soil_carbon_layer(self, aoi, landscape):
        soil_layer = InputLayer.objects.get(
            name='Soil carbon',
            data_provider=self.get_provider(),
            group__name='near-real-time'
        )
        aoi_fc = ee.FeatureCollection([ee.Feature(aoi)])
        soil_img = BaseInputLayer().get_soil_carbon(
            start_date=datetime.date(1984, 1, 1),
            end_date=datetime.date(2019, 12, 31),
            clip_to_countries=False,
            aoi=aoi_fc
        )
        return LayerCacheResult(
            soil_layer,
            soil_img.getMapId(
                self.metadata_to_vis_params(soil_layer)
            )['tile_fetcher'].url_format,
            f'{landscape.id}'
        )

    def _generate_grazing_capacity_layer(self, aoi, landscape):
        grazing_layer = InputLayer.objects.get(
            name='Grazing capacity',
            data_provider=self.get_provider(),
            group__name='near-real-time'
        )
        grazing_img = calculate_grazing_capacity(
            aoi,
            self.NRT_START_DATE,
            datetime.date.today().isoformat()
        )
        return LayerCacheResult(
            grazing_layer,
            grazing_img.getMapId(
                self.metadata_to_vis_params(grazing_layer)
            )['tile_fetcher'].url_format,
            f'{landscape.id}'
        )

    def _generate_soil_carbon_change_layer(self, aoi, landscape):
        change_layer = InputLayer.objects.get(
            name='Soil carbon change',
            data_provider=self.get_provider(),
            group__name='near-real-time'
        )
        aoi_fc = ee.FeatureCollection([ee.Feature(aoi)])
        change_img = BaseInputLayer().get_soil_carbon_change(
            start_date=datetime.date(1984, 1, 1),
            end_date=datetime.date(2019, 12, 31),
            clip_to_countries=False,
            aoi=aoi_fc
        )
        return LayerCacheResult(
            change_layer,
            change_img.getMapId(
                self.metadata_to_vis_params(change_layer)
            )['tile_fetcher'].url_format,
            f'{landscape.id}'
        )

    def _generate_woody_cover_layer(self, aoi, nrt_end_dt, landscape):
        try:
            cgls_nrt = (ee.ImageCollection(
                            GEEAsset.fetch_asset_source('cgls_ground_cover'))
                        .filterDate(self.NRT_START_DATE, nrt_end_dt)
                        .filterBounds(aoi)
                        .select(['tree-coverfraction', 'shrub-coverfraction'])
                        .median())

            woody_img = (
                cgls_nrt.select(
                    'tree-coverfraction'
                ).add(
                    cgls_nrt.select('shrub-coverfraction')
                ).rename('Woody cover'))

            woody_layer = InputLayer.objects.get(
                name='Woody plant cover',
                data_provider=self.get_provider(),
                group__name='near-real-time'
            )

            return LayerCacheResult(
                woody_layer,
                woody_img.getMapId(
                    self.metadata_to_vis_params(woody_layer)
                )['tile_fetcher'].url_format,
                f'{landscape.id}'
            )

        except Exception:
            logger.exception(f'Generating woody cover failed on {landscape}')
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
            fire = self._generate_fire_frequency_layer(
                aoi, landscape
            )
            if fire:
                results.append(fire)

            # soil carbon asset is only available up to 2019
            # soil = self._generate_soil_carbon_layer(aoi, landscape)
            # if soil:
            #     results.append(soil)

            # TODO: Grazing Capacity got computation timed out error
            # grazing = self._generate_grazing_capacity_layer(aoi, landscape)
            # if grazing:
            #     results.append(grazing)

            # soil carbon asset is only available up to 2019
            # soil_change = self._generate_soil_carbon_change_layer(
            #     aoi, landscape
            # )
            # if soil_change:
            #     results.append(soil_change)

            # woody cover asset is only available up to 2019            
            # woody = self._generate_woody_cover_layer(
            #     aoi, nrt_end_dt, landscape
            # )
            # if woody:
            #     results.append(woody)

            # Note: Above commented out layers are also removed from
            # fixture 3.input_layer.json

        return results
