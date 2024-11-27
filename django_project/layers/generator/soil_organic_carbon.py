# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer Generator for Soil Organic Carbon Data.
"""
import ee

from layers.models import InputLayer
from layers.generator.base import BaseLayerGenerator, LayerCacheResult


class SoilOrganicCarbonGenerator(BaseLayerGenerator):
    """Layer Generator for Soil Organic Carbon Baseline."""

    def _map_bands(self, feature):
        """Map bands feature."""
        feature = feature.divide(ee.Image(1000)).copyProperties(feature)
        year = ee.Number(feature.get('year'))
        return ee.Image(year).int().addBands(feature).set('year', year)

    def _generate(self):
        """Generate layers from Soil Organic Carbon asset."""
        # fetch countries
        countries = self.get_countries()

        # Import soil organic carbon data from Venter et al 2021
        # https://www.sciencedirect.com/science/article/pii/S0048969721004526
        soil_organic = ee.ImageCollection(
            'users/grazingresearch/Collaboration/Soil_C/predictions2'
        )
        soil_organic = soil_organic.map(self._map_bands)

        # SOC Mean
        lt_mean = soil_organic.select(1).median().rename('SOC')

        # SOC Trend
        trend_sens_img = soil_organic.reduce(reducer=ee.Reducer.sensSlope())
        trend_sens_img = trend_sens_img.rename(['scale', 'offset'])
        soc_lt_trend = trend_sens_img.select(
            'scale'
        ).multiply(35).clipToCollection(countries)

        # Additional SOC data from iSDA dataset for rest of Africa
        # Convert to SOC stocks using bulk density, fraction coarse fragments
        # Fill in gaps with SoilGrids
        isda = ee.Image(
            'users/zandersamuel/Africa_misc/'
            'iSDA_SOC_m_30m_0_20cm_2001_2017_v0_13_wgs84'
        )
        isda = ee.Image(ee.Image(isda.divide(10)).exp()).subtract(1)

        # Soil bulk density (fine earth) g / m3
        bd = ee.Image(
            'users/zandersamuel/SA_misc/SoilGrids_BD'
        ).rename('soil_bd').selfMask().divide(100)
        bd2 = ee.Image(
            'ISDASOIL/Africa/v1/bulk_density'
        ).select('mean_0_20').rename('soil_bd').divide(100)
        bd = ee.ImageCollection(
            [bd2.float(), bd.float()]
        ).mosaic()

        # Coast fragment fraction 0-1
        cfvo = ee.Image(
            'users/zandersamuel/SA_misc/Soilgrids_CFVO'
        ).selfMask().rename('soil_cfvo').divide(1000)
        cfvo2 = ee.Image(
            'ISDASOIL/Africa/v1/stone_content'
        ).select('mean_0_20').rename('soil_cfvo').divide(100)
        cfvo = ee.ImageCollection(
            [cfvo2.float(), cfvo.float()]
        ).mosaic()

        isda = isda.multiply(
            bd
        ).multiply(
            ee.Image(1).subtract(cfvo)
        ).multiply(0.6).rename('SOC')

        # Get mean SOC from Venter et al and iSDA
        soc_lt_mean = ee.ImageCollection(
            [isda.float(), lt_mean.float()]
        ).mean()
        soc_lt_mean = soc_lt_mean.clipToCollection(countries)

        # Soil Organic Carbon
        soc_layer = InputLayer.objects.get(
            name='Soil carbon 1984-2019',
            data_provider=self.get_provider()
        )

        # Soil Organic Carbon change
        socc_layer = InputLayer.objects.get(
            name='Soil carbon change 1984-2019',
            data_provider=self.get_provider()
        )

        return [
            LayerCacheResult(
                soc_layer,
                soc_lt_mean.getMapId(
                    self.metadata_to_vis_params(soc_layer)
                )['tile_fetcher'].url_format
            ),
            LayerCacheResult(
                socc_layer,
                soc_lt_trend.getMapId(
                    self.metadata_to_vis_params(socc_layer)
                )['tile_fetcher'].url_format
            )
        ]
