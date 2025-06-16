# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Landscape APIs
"""
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


def querying_vector_tile(
        table_name: str, field_names: list, z: int, x: int, y: int,
        json_fields: list = None
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
        tiles = querying_vector_tile(
            EarthRangerEvents._meta.db_table,
            field_names=[
                'id', 'earth_ranger_uuid', 'data'
            ],
            json_fields=['data'],
            z=z, x=x, y=y
        )

        # If no tile 404
        if not len(tiles):
            raise Http404()
        return HttpResponse(tiles, content_type="application/x-protobuf")
