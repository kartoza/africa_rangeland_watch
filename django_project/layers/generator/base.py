# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Base class for layer url generator.
"""
import ee
import logging
from typing import List
from django.core.cache import cache

from analysis.models import GEEAsset
from layers.models import InputLayer, DataProvider


logger = logging.getLogger(__name__)


class LayerCacheResult:
    """Class to represent layer cache result."""

    def __init__(
            self, layer: InputLayer, file_url: str, additional_key = None):
        """Initialize class."""
        self.layer = layer
        self.file_url = file_url
        self.additional_key = additional_key

    def cache_key(self):
        """Get cache key."""
        if self.additional_key:
            return f'{str(self.layer.uuid)}-{self.additional_key}'
        return f'{str(self.layer.uuid)}'


class BaseLayerGenerator:
    """Base class for layer generator."""

    DEFAULT_TIMEOUT_IN_S = 60 * 60 * 24

    def get_provider(self):
        """Get GEE Data Provider"""
        return DataProvider.objects.get(
            name='Google Earth Engine'
        )

    def get_countries(self):
        """Get countries for ARW."""
        names = [
            'SOUTH AFRICA',
            'LESOTHO',
            'SWAZILAND',
            'NAMIBIA',
            'ZIMBABWE',
            'BOTSWANA',
            'MOZAMBIQUE',
            'ZAMBIA'
        ]
        return ee.FeatureCollection(
            GEEAsset.fetch_asset_source('countries')
        ).filter(ee.filter.Filter.inList('name', names))

    def save_url_to_cache(self, key: str, url: str):
        """Save URL to cache."""
        cache.set(key, url, timeout=self.DEFAULT_TIMEOUT_IN_S)

    def metadata_to_vis_params(self, layer: InputLayer) -> dict:
        """Get visualization parameters from layer metadata."""
        return layer.get_vis_params()

    def _generate(self) -> List[LayerCacheResult]:
        raise NotImplementedError('_generate is not implemented!')

    def generate(self):
        """Generate layer using GEE."""
        try:
            layers = self._generate()

            # save layers url to cache
            for layer in layers:
                self.save_url_to_cache(layer.cache_key(), layer.file_url)
        except Exception as ex:
            logger.error(f'Failed {self.__class__.__name__} generator!')
            logger.error(ex)
