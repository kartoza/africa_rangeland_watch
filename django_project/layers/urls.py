from django.urls import path
from .views import (
    delete_layer,
    download_layer,
    user_input_layers,
    trigger_cog_export,
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
        'nrt-layer/<uuid:uuid>/export/',
        trigger_cog_export,
        name='trigger_cog_export'
    ),
]
