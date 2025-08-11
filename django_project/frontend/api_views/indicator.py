# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Indicator APIs
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.models import Indicator, UserIndicator
from frontend.serializers.indicator import (
    IndicatorSerializer,
    UserIndicatorSerializer
)


class IndicatorAPI(APIView):
    """API to return list of indicator."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch list of Indicator."""
        indicator_queryset = Indicator.objects.filter(is_active=True)
        serializer = IndicatorSerializer(indicator_queryset, many=True)

        response = serializer.data

        # If user is authenticated, fetch user-specific indicators
        if request.user.is_authenticated:
            user_indicators = UserIndicator.objects.filter(
                created_by=request.user
            )
            user_serializer = UserIndicatorSerializer(
                user_indicators, many=True
            )
            response += user_serializer.data

        return Response(
            status=200,
            data=response
        )
