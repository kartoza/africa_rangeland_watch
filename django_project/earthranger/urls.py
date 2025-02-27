from django.urls import path
from .views import list_events, fetch_event_details


urlpatterns = [
    path("events/", list_events, name="list_events"),
    path(
        "events/<str:event_id>/",
        fetch_event_details,
        name="fetch_event_details"
    ),
]
