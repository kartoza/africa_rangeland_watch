from django.urls import path, re_path
from .views import (
    ListEventsView,
    fetch_event_details,
    EarthRangerImageProxyView,
    EarthRangerSettingListCreateView,
    EarthRangerSettingDetailView
)


app_name = 'earthranger'

urlpatterns = [
    path(
        "earthranger/events/",
        ListEventsView.as_view(),
        name="list_events"
    ),
    # List all events for user
    path(
        'earthranger/events/',
        ListEventsView.as_view(),
        name='events-list'
    ),
    # List events for specific setting
    path(
        'earthranger/settings/<int:settings_id>/events/',
        ListEventsView.as_view(),
        name='setting-events-list'
    ),
    path(
        'earthranger/settings/<int:pk>/',
        EarthRangerSettingDetailView.as_view(),
        name='settings-detail'
    ),
    path(
        'earthranger/settings/',
        EarthRangerSettingListCreateView.as_view(),
        name='setting-list-create'
    ),
    path(
        "earthranger/events/<str:event_id>/",
        fetch_event_details,
        name="fetch-event-details"
    ),
    re_path(
        r'^api/earth-ranger/proxy-image/(?P<image_path>.*)$',
        EarthRangerImageProxyView.as_view(),
        name='earth-ranger-image-proxy'
    )
]
