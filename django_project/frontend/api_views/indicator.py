# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Indicator APIs
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.models import Indicator
from frontend.serializers.indicator import IndicatorSerializer


class IndicatorAPI(APIView):
    """API to return list of indicator."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch list of Indicator."""
        queryset = Indicator.objects.filter(is_active=True)
        serializer = IndicatorSerializer(queryset, many=True)

        return Response(
            status=200,
            data=serializer.data
        )
