# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Landscape APIs
"""
import logging
import math

from django.db import connection
from django.db.models import Count, Q
from django.http import Http404, HttpResponse
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import mixins, GenericViewSet

from earthranger.models import EarthRangerEvents, EarthRangerSetting
from core.pagination import Pagination
from frontend.serializers.earth_ranger import EarthRangerEventSerializer

logger = logging.getLogger(__name__)


def querying_vector_tile(
        table_name: str, field_names: list, z: int, x: int, y: int,
        json_fields: list = None, where_clause: str = ""
):
    """Return vector tile from table name."""
    # Define the zoom level at which to start simplifying geometries
    simplify_zoom_threshold = 5

    simplify_tolerance = (
        0 if z > simplify_zoom_threshold else
        1000 * math.exp(simplify_zoom_threshold - z)
    )

    # Conditional geometry transformation
    geometry_transform = (
        f"ST_Simplify(ST_Transform(geometry, 3857), {simplify_tolerance})"
        if simplify_tolerance > 0 else "ST_Transform(geometry, 3857)"
    )

    # Build field selection with JSON expansion
    field_selections = []

    for field in field_names:
        if json_fields and field in json_fields:
            # Option 1: Expand JSON as text (preserves structure)
            field_selections.append(f'"{field}"::text as "{field}"')
        else:
            field_selections.append(f'"{field}"')

    sql = f"""
        WITH mvtgeom AS
        (
            SELECT {','.join(field_selections)} ,
                ST_AsMVTGeom(
                    {geometry_transform},
                    ST_TileEnvelope({z}, {x}, {y}),
                    extent => 4096, buffer => 64
                ) as geom
                FROM {table_name}
                {where_clause}
        )
        SELECT ST_AsMVT(mvtgeom.*)
        FROM mvtgeom;
    """

    tiles = []

    # Raw query it
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
        for row in rows:
            tiles.append(bytes(row[0]))
    return tiles



class EarthRangerEventsViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet
):
    """Earth Ranger ViewSet."""

    permission_classes = (AllowAny,)
    serializer_class = EarthRangerEventSerializer
    queryset = EarthRangerEvents.objects.all()
    pagination_class = Pagination
    throttle_classes = []  # Apply globally for all actions

    def get_throttles(self):
        """Get throttle classes."""
        throttles = super().get_throttles()
        if self.action == 'vector_tile':
            throttles = []
        return throttles

    @action(detail=False, methods=["get"])
    def vector_tile(self, request, z, x, y):
        """Return vector tile of landscape."""
        # Determine which settings to include based on authentication
        if request.user.is_authenticated:
            # Authenticated users: public settings + their private settings
            settings_filter = Q(privacy='public') | Q(user=request.user, privacy='private')  # noqa
        else:
            # Unauthenticated users: only public settings
            settings_filter = Q(privacy='public')

        # Get the relevant EarthRanger settings
        earth_ranger_settings = EarthRangerSetting.objects.filter(
            settings_filter,
            # is_active=True  # Only include active settings
        )

        # Get events that belong to these settings
        events = EarthRangerEvents.objects.filter(
            earth_ranger_settings__in=earth_ranger_settings
        ).distinct()

        event_types = request.query_params.getlist('event_type')
        if event_types:
            events = events.filter(event_type__in=event_types)

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            events = events.filter(event_time__date__gte=start_date)
        if end_date:
            events = events.filter(event_time__date__lte=end_date)

        # If no events found, return 404
        if not events.exists():
            raise Http404()

        # Build the WHERE clause for the SQL query to filter by event IDs
        event_ids = list(events.values_list('id', flat=True))
        where_clause = f"WHERE id IN ({','.join(map(str, event_ids))})"

        tiles = querying_vector_tile(
            EarthRangerEvents._meta.db_table,
            field_names=[
                'id', 'earth_ranger_uuid', 'data'
            ],
            json_fields=['data'],
            z=z, x=x, y=y,
            where_clause=where_clause  # Pass the WHERE clause
        )

        # If no tile 404
        if not len(tiles):
            raise Http404()
        return HttpResponse(tiles, content_type="application/x-protobuf")


class EarthRangerEventTypesAPI(APIView):
    """
    GET /api/earth-ranger/event-types/

    Return the distinct (event_type, event_category) pairs available to
    the requesting user, based on the privacy of the underlying
    EarthRangerSetting records.

    Authenticated users see events from public settings plus their own
    private settings.  Unauthenticated users see public settings only.

    Response body (JSON):
        [
            {"event_type": "...", "event_category": "..."},
            ...
        ]
    """

    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            settings_filter = (
                Q(privacy='public') | Q(user=request.user, privacy='private')
            )
        else:
            settings_filter = Q(privacy='public')

        earth_ranger_settings = EarthRangerSetting.objects.filter(
            settings_filter
        )

        event_types = (
            EarthRangerEvents.objects
            .filter(earth_ranger_settings__in=earth_ranger_settings)
            .exclude(event_type='')
            .values('event_type')
            .annotate(count=Count('id'))
            .order_by('event_type')
        )

        return Response([
            {'event_type': row['event_type'], 'count': row['count']}
            for row in event_types
        ])
