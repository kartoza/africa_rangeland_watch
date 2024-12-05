# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for CGLS Data.
"""
import ee

from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class CGLSGenerator(BaseLayerGenerator):
    """Layer Generator for BG, Woody, and Grass Baseline."""

    def _generate_bands(self, feature):
        """Generate bands map function."""
        bg = feature.select('bare-coverfraction').add(
            feature.select('urban-coverfraction')
        ).rename('bg')
        t = feature.select('tree-coverfraction').add(
            feature.select('shrub-coverfraction')
        ).rename('t')
        g = feature.select('grass-coverfraction').rename('g')
        return bg.addBands([t, g]) \
            .copyProperties(feature) \
            .set('year', ee.Number.parse(feature.get('system:index')))

    def _generate(self):
        """Generate layers from CGLS asset."""
        # fetch countries
        countries = self.get_countries()

        # Get MODIS vegetation data
        cgls_col = ee.ImageCollection(
            'COPERNICUS/Landcover/100m/Proba-V-C3/Global'
        ).select(
            [
                'bare-coverfraction',
                'crops-coverfraction',
                'urban-coverfraction',
                'shrub-coverfraction',
                'grass-coverfraction',
                'tree-coverfraction'
            ]
        ).filterBounds(countries)

        # map bands
        cgls_col = cgls_col.map(self._generate_bands)

        # get layers
        cgls = cgls_col.median()

        # Bare ground cover 2015-2020
        bg_baseline = cgls.select(
            'bg'
        ).clipToCollection(countries)
        bg_layer = InputLayer.objects.get(
            name='Bare ground cover 2015-2020',
            data_provider=self.get_provider()
        )

        # Woody plant cover
        woody_baseline = cgls.select(
            't'
        ).clipToCollection(countries)
        woody_layer = InputLayer.objects.get(
            name='Woody plant cover 2015-2020',
            data_provider=self.get_provider()
        )

        # Grass cover
        grass_baseline = cgls.select(
            'g'
        ).clipToCollection(countries)
        grass_layer = InputLayer.objects.get(
            name='Grass cover 2015-2020',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                bg_layer,
                bg_baseline.getMapId(
                    self.metadata_to_vis_params(bg_layer)
                )['tile_fetcher'].url_format
            ),
            LayerCacheResult(
                woody_layer,
                woody_baseline.getMapId(
                    self.metadata_to_vis_params(woody_layer)
                )['tile_fetcher'].url_format
            ),
            LayerCacheResult(
                grass_layer,
                grass_baseline.getMapId(
                    self.metadata_to_vis_params(grass_layer)
                )['tile_fetcher'].url_format
            )
        ]
