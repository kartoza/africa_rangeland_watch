from django.urls import path, re_path
from .views import (
    ListEventsView,
    fetch_event_details,
    EarthRangerImageProxyView
)


urlpatterns = [
    path("earthranger/events/", ListEventsView.as_view(), name="list_events"),
    path(
        "earthranger/events/<str:event_id>/",
        fetch_event_details,
        name="fetch_event_details"
    ),
    re_path(
        r'^api/earth-ranger/proxy-image/(?P<image_path>.*)$',
        EarthRangerImageProxyView.as_view(),
        name='earth_ranger_image_proxy'
    ),
]
