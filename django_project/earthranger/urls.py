from django.urls import path, re_path
from .views import (
    ListEventsView,
    fetch_event_details,
    EarthRangerImageProxyView,
    EarthRangerSettingListCreateView,
    EarthRangerSettingDetailView,
    EarthRangerSettingToggleActiveView
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
    path(
        'earthranger/settings/',
        EarthRangerSettingListCreateView.as_view(),
        name='setting-list-create'
    ),
    path(
        'earthranger/settings/<int:pk>/',
        EarthRangerSettingDetailView.as_view(),
        name='setting-detail'
    ),
    path(
        'earthranger/settings/<int:pk>/toggle-active/',
        EarthRangerSettingToggleActiveView.as_view(),
        name='setting-toggle-active'
    )
]
