from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
import requests
import logging
from cloud_native_gis.utils.vector_tile import querying_vector_tile
from django.http import Http404, HttpResponse
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.viewsets import mixins, GenericViewSet

from earthranger.models import EarthRangerEvents
from core.pagination import Pagination
from frontend.serializers.earth_ranger import EarthRangerEventSerializer 

import requests
import base64
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging


logger = logging.getLogger(__name__)


from django.db import connection
import math
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


class EarthRangerImageProxyView(APIView):
    """
    Proxy images from EarthRanger with authentication.
    Requires user to be authenticated to access images.
    """
    # permission_classes = [IsAuthenticated]
    permission_classes = (AllowAny,)
    
    # @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def get(self, request, image_path):
        """
        Fetch and return image from EarthRanger with proper authentication
        """
        try:
            # Construct the full URL
            headers = {
                "accept": "application/json",
                "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
            }
            # Clean and construct the full URL
            image_path = image_path.lstrip('/')
            full_url = f"{settings.EARTH_RANGER_API_URL}/{image_path}/"
            
            # Fetch the image with timeout
            response = requests.get(
                full_url, 
                headers=headers, 
                stream=True,
                timeout=30,
                verify=getattr(settings, 'EARTH_RANGER_VERIFY_SSL', True)
            )
            response.raise_for_status()
            
            # Validate content type
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logger.warning(f"Non-image content type received: {content_type}")
                return Response(
                    {"error": "Invalid image format"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create Django response with the image
            django_response = HttpResponse(
                response.content,
                content_type=content_type
            )
            
            # Add security and cache headers
            django_response['Cache-Control'] = 'private, max-age=900'  # 15 minutes
            django_response['X-Content-Type-Options'] = 'nosniff'
            django_response['Content-Security-Policy'] = "default-src 'none'"
            
            # Add content length if available
            if 'content-length' in response.headers:
                django_response['Content-Length'] = response.headers['content-length']
            
            return django_response
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching image: {full_url}")
            return Response(
                {"error": "Image request timeout"}, 
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error fetching image: {e.response.status_code} - {full_url}")
            if e.response.status_code == 404:
                raise Http404("Image not found")
            elif e.response.status_code == 403:
                return Response(
                    {"error": "Access denied to image"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                return Response(
                    {"error": "Failed to fetch image"}, 
                    status=status.HTTP_502_BAD_GATEWAY
                )
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error fetching image: {str(e)} - {full_url}")
            return Response(
                {"error": "Image service unavailable"}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Unexpected error fetching image: {str(e)} - {full_url}")
            return Response(
                {"error": "Internal server error"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
