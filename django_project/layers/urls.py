from django.urls import path
from .views import (
    delete_layer,
    download_layer,
    user_input_layers,
    download_from_gdrive
)

urlpatterns = [
    path(
        'user-input-layers/',
        user_input_layers,
        name='user_input_layers'
    ),
    path(
        'delete-layer/<uuid:uuid>/',
        delete_layer,
        name='delete_layer'
    ),
    path(
        'download-layer/<uuid:uuid>/',
        download_layer,
        name='download_layer'
    ),
    path(
        'nrt-layer/<uuid:uuid>/download/',
        download_from_gdrive,
        name='nrt-layer-download'
    ),
]
