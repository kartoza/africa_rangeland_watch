# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer APIs
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from layers.models import InputLayer
from frontend.serializers.layers import LayerSerializer


class LayerAPI(APIView):
    """API to return list of Layer."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Fetch list of Layer."""
        return Response(
            status=200,
            data=LayerSerializer(
                InputLayer.objects.all(),
                many=True
            ).data
        )
