# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: BaseMap APIs
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Preferences
from frontend.models import BaseMap
from frontend.serializers.base_map import BaseMapSerializer


class BaseMapAPI(APIView):
    """API to return list of base map."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch list of BaseMap."""
        return Response(
            status=200,
            data=BaseMapSerializer(
                BaseMap.objects.all(),
                many=True
            ).data
        )


class MapConfigAPI(APIView):
    """API to fetch map config."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch map config."""
        preferences = Preferences.load()

        return Response(
            status=200,
            data={
                'initial_bound': preferences.map_initial_bound,
                'spatial_reference_layer_max_area': (
                    preferences.spatial_reference_layer_max_area
                ),
                'max_wait_analysis_run_time': (
                    preferences.max_wait_analysis_run_time
                )
            }
        )
