from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    delete_layer,
    download_layer,
    user_input_layers,
)
from .views_api import (
    ExternalLayerViewSet,
)

# Create a router and register our viewset with it.
router = DefaultRouter()
router.register(
    r"external-layers",
    ExternalLayerViewSet,
    basename="external-layer"
)

urlpatterns = [
    # Function-based views(user-defined layers)
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

    # Include the router URLs
    path(
        "api/",
        include(router.urls),
        name="api"
    ),
]
