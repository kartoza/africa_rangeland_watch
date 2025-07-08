import requests
import logging
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.generics import ListAPIView
from django.conf import settings
from django.http import Http404, HttpResponse
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from earthranger.serializers import (
    EarthRangerEventsSerializer,
    EarthRangerEventsSimpleSerializer
)
from earthranger.models import EarthRangerEvents
from core.pagination import Pagination


logger = logging.getLogger(__name__)


class ListEventsView(ListAPIView):
    """
    List all stored events with optional filtering and pagination.
    """
    serializer_class = EarthRangerEventsSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        """
        Get queryset with optional filtering.
        """
        queryset = EarthRangerEvents.objects.all()

        # Extract optional filters from query parameters
        event_type = self.request.GET.get("event_type")
        event_category = self.request.GET.get("event_category")

        # Apply filters at the database level for better performance
        if event_type:
            queryset = queryset.filter(data__event_type=event_type)
        if event_category:
            queryset = queryset.filter(
                data__event_category=event_category
            )

        queryset = queryset.order_by("-data__time")

        return queryset

    def list(self, request, *args, **kwargs):
        """
        Override list method to customize response format.
        """
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            # Extract data field from each event
            simple = request.GET.get(
                "simple", "false"
            ).lower() in ["true", "1", "yes"]
            event_data = [event.data for event in page]
            if simple:
                event_data = EarthRangerEventsSimpleSerializer(
                    page, many=True
                ).data
            return self.get_paginated_response(event_data)

        # If pagination is not applied
        event_data = [event.data for event in queryset]
        return Response(event_data, status=status.HTTP_200_OK)


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
    """
    permission_classes = (AllowAny,)

    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
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
            full_url = f"{settings.EARTH_RANGER_API_URL}{image_path}"

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
                logger.warning(
                    f"Non-image content type received: {content_type}"
                )
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
            django_response['Cache-Control'] = 'private, max-age=900'
            django_response['X-Content-Type-Options'] = 'nosniff'
            django_response['Content-Security-Policy'] = "default-src 'none'"

            # Add content length if available
            if 'content-length' in response.headers:
                django_response['Content-Length'] = (
                    response.headers['content-length']
                )

            return django_response

        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching image: {full_url}")
            return Response(
                {"error": "Image request timeout"},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.HTTPError as e:
            logger.error(
                (
                    f"HTTP error fetching image: "
                    f"{e.response.status_code} - {full_url}"
                )
            )
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
            logger.error(
                f"Request error fetching image: {str(e)} - {full_url}"
            )
            return Response(
                {"error": "Image service unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(
                f"Unexpected error fetching image: {str(e)} - {full_url}"
            )
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
