from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
import requests
import logging
from .models import EarthRangerEvents



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_events(request):
    """
    Fetch all stored events with optional filtering.
    """

    # Extract optional filters from query parameters
    event_type = request.GET.get("event_type")
    event_category = request.GET.get("event_category")

    # Get the stored event data
    event_instance = get_object_or_404(EarthRangerEvents, name="Events")

    # Extract JSON data
    event_data = event_instance.data.get("data", {}).get("results", [])

    # Apply filters
    if event_type:
        event_data = [
            event for event in event_data
            if event.get("event_type") == event_type
        ]

    if event_category:
        event_data = [
            event for event in event_data
            if event.get("event_category") == event_category
        ]

    return Response({"events": event_data}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_event_details(request, event_id):
    """
    Fetch details of a specific event using its ID from Earth Ranger API.
    """
    api_url = f"{settings.EARTH_RANGER_API_URL}/activity/event/{event_id}/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
    }

    response = requests.get(api_url, headers=headers)

    if response.status_code == 200:
        return Response(response.json(), status=status.HTTP_200_OK)

    logging.error(
        f"Failed to fetch event details: {response.status_code}"
        f" - {response.text}"
    )
    return Response(
        {
            "error": "Failed to fetch event details"
        }, status=response.status_code)
