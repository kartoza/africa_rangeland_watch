# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: ARW Frontend API urls.
"""

from django.urls import path

from frontend.api_views.base_map import BaseMapAPI, MapConfigAPI
from frontend.api_views.landscape import LandscapeAPI
from frontend.api_views.layers import LayerAPI


# BaseMap APIs
base_map_urls = [
    path(
        'base_map/',
        BaseMapAPI.as_view(),
        name='base-map'
    ),
    path(
        'map_config/',
        MapConfigAPI.as_view(),
        name='map-config'
    )
]

# Landscape APIs
landscape_urls = [
    path(
        'landscape/',
        LandscapeAPI.as_view(),
        name='landscape'
    )
]

# Layers APIs
layers_urls = [
    path(
        'layer/',
        LayerAPI.as_view(),
        name='layer'
    )]


urlpatterns = base_map_urls + landscape_urls + layers_urls
