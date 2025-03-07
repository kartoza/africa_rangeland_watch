from django.urls import path
from .views import list_events, fetch_event_details


urlpatterns = [
    path("earthranger/events/", list_events, name="list_events"),
    path(
        "earthranger/events/<str:event_id>/",
        fetch_event_details,
        name="fetch_event_details"
    ),
]
