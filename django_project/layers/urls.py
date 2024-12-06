from django.urls import path
from .views import user_input_layers

urlpatterns = [
    path(
        'user-input-layers/',
        user_input_layers,
        name='user_input_layers'
    ),
]
