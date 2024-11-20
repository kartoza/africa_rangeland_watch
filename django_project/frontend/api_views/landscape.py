# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Landscape APIs
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.models import Landscape
from frontend.serializers.landscape import LandscapeSerializer


class LandscapeAPI(APIView):
    """API to return list of Landscape."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Fetch list of Landscape."""
        return Response(
            status=200,
            data=LandscapeSerializer(
                Landscape.objects.all(),
                many=True
            ).data
        )
