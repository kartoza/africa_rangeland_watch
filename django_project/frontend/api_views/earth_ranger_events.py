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
            z=z, x=x, y=y
        )

        # If no tile 404
        if not len(tiles):
            raise Http404()
        return HttpResponse(tiles, content_type="application/x-protobuf")
