# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Landscape APIs
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.models import Landscape
from layers.models import InputLayer
from frontend.serializers.landscape import LandscapeSerializer


class LandscapeAPI(APIView):
    """API to return list of Landscape."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch list of Landscape."""
        nrt_layers = InputLayer.objects.filter(
            group__name='near-real-time'
        )

        return Response(
            status=200,
            data=LandscapeSerializer(
                Landscape.objects.all(),
                many=True,
                context={
                    'nrt_layers': [str(layer.uuid) for layer in nrt_layers]
                }
            ).data
        )
