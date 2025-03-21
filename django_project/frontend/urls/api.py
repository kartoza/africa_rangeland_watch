# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: ARW Frontend API urls.
"""

from django.urls import path, re_path
from rest_framework.routers import DefaultRouter

from frontend.api_views.analysis import AnalysisAPI
from frontend.api_views.base_map import BaseMapAPI, MapConfigAPI
from frontend.api_views.landscape import LandscapeViewSet
from frontend.api_views.layers import (
    LayerAPI,
    UploadLayerAPI,
    PMTileLayerAPI,
    DataPreviewAPI,
    UploadExportedFile,
    SubmitExportLayerRequest,
    ExportLayerRequestStatus,
    DownloadLayerExportedFile
)

router = DefaultRouter()
router.register(r'landscapes', LandscapeViewSet, basename='landscapes')

# BaseMap APIs
base_map_urls = [
    path(
        'base-map/',
        BaseMapAPI.as_view(),
        name='base-map'
    ),
    path(
        'map-config/',
        MapConfigAPI.as_view(),
        name='map-config'
    )
]

# Layers APIs
layers_urls = [
    path(
        'layer/',
        LayerAPI.as_view(),
        name='layer'
    ),
    path(
        'upload-layer/',
        UploadLayerAPI.as_view(),
        name='upload-layer'
    ),
    path(
        'pmtile-layer/<int:upload_id>/',
        PMTileLayerAPI.as_view(),
        name='pmtile-layer'
    ),
    re_path(
        r'^data-preview/(?P<pk>[\da-f-]+)/$',
        DataPreviewAPI.as_view(),
        name='data-preview'
    ),
    path(
        'upload-exported-file/<int:request_id>/',
        UploadExportedFile.as_view(),
        name='upload-exported-file'
    ),
    path(
        'export-layer/status/<int:request_id>/',
        ExportLayerRequestStatus.as_view(),
        name='status-export-layer-request'
    ),
    path(
        'export-layer/download/<int:request_id>/',
        DownloadLayerExportedFile.as_view(),
        name='download-exported-layer-file'
    ),
    path(
        'export-layer/submit/',
        SubmitExportLayerRequest.as_view(),
        name='submit-export-layer-request'
    )
]

urlpatterns = base_map_urls + layers_urls + router.urls + [
    # Custom route for vector tiles
    path(
        'landscapes/vector_tile/<int:z>/<int:x>/<int:y>/',
        LandscapeViewSet.as_view({'get': 'vector_tile'}),
        name='landscape-vector-tile'
    ),
    path(
        'analysis/',
        AnalysisAPI.as_view(),
        name='analysis'
    ),
]
