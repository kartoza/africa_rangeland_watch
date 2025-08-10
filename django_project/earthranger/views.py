import logging
import requests
import urllib.parse

from django.conf import settings
from django.db.models import Q
from django.http import Http404, HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.pagination import Pagination
from earthranger.models import EarthRangerEvents, EarthRangerSetting
from earthranger.serializers import (
    EarthRangerEventsSerializer,
    EarthRangerEventsSimpleSerializer,
    EarthRangerSettingListSerializer,
    EarthRangerSettingSerializer,
)
from earthranger.utils import get_base_api_url


logger = logging.getLogger(__name__)


class ListEventsView(ListAPIView):
    """
    List all stored events with optional filtering and pagination.
    If settings_id is provided, filter events by that specific
    setting and related settings.
    """
    serializer_class = EarthRangerEventsSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        """
        Get queryset with optional filtering.
        """
        settings_id = self.kwargs.get('settings_id')

        if settings_id:
            # Get the specific setting and verify ownership
            try:
                setting = EarthRangerSetting.objects.get(
                    id=settings_id,
                    user=self.request.user
                )
            except EarthRangerSetting.DoesNotExist:
                # Return empty queryset if setting doesn't
                # exist or user doesn't own it
                return EarthRangerEvents.objects.none()

            # Find all settings with same URL and token
            matching_settings = EarthRangerSetting.objects.filter(
                url=setting.url,
                token=setting.token
            )

            # Get events for all matching settings
            queryset = EarthRangerEvents.objects.filter(
                earth_ranger_settings__in=matching_settings
            )
        else:
            # Original behavior - get all events for the user
            user_settings = EarthRangerSetting.objects.filter(
                user=self.request.user
            )
            queryset = EarthRangerEvents.objects.filter(
                earth_ranger_settings__in=user_settings
            )

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
            event_uuid = image_path.split('/')[2]
            er_event = EarthRangerEvents.objects.filter(
                earth_ranger_uuid=event_uuid
            ).first()

            er_setting = None
            if er_event:
                er_setting = er_event.earth_ranger_settings.all().first()
                if not er_setting:
                    if not er_event:
                        return Response(
                            {"error": "Event does not exist!"},
                            status=status.HTTP_404_NOT_FOUND
                        )

            # Clean and construct the full URL
            image_path = image_path.lstrip('/')
            base_url = (
                er_setting.url if er_setting else
                settings.EARTH_RANGER_API_URL
            )
            base_api_url = get_base_api_url(base_url)
            full_url = urllib.parse.urljoin(base_api_url, image_path)
            token = (
                er_setting.token if er_setting else
                settings.EARTH_RANGER_AUTH_TOKEN
            )

            # Construct header
            headers = {
                "accept": "application/json",
                "Authorization": f"Bearer {token}"
            }

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


class EarthRangerSettingPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class EarthRangerSettingListCreateView(generics.ListCreateAPIView):
    """
    List all EarthRanger settings or create a new one.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = EarthRangerSettingPagination

    def get_queryset(self):
        queryset = EarthRangerSetting.objects.\
            select_related('user').order_by('-updated_at')

        # Filter by current user's settings only
        queryset = queryset.filter(user=self.request.user)

        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(url__icontains=search)
            )

        # Filter by privacy type
        privacy_type = self.request.query_params.get('privacy', None)
        if privacy_type:
            queryset = queryset.filter(privacy=privacy_type)

        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return EarthRangerSettingListSerializer
        return EarthRangerSettingSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EarthRangerSettingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an EarthRanger setting.
    """
    serializer_class = EarthRangerSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only access their own settings
        return EarthRangerSetting.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        # Ensure the user remains the same during updates
        serializer.save(user=self.request.user)
