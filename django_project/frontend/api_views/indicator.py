# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Indicator APIs
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.models import Indicator


class IndicatorAPI(APIView):
    """API to return list of indicator."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch list of Indicator."""
        data = [
            {
                'name': indicator.name,
                'variable': indicator.variable_name,
                'analysis_types': indicator.analysis_types,
                'temporal_resolutions': indicator.temporal_resolution,
                'source': indicator.source,
            }
            for indicator in Indicator.objects.filter(
                is_active=True
            )
        ]

        return Response(
            status=200,
            data=data
        )
