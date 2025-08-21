# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Indicator APIs
"""

import ee
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from analysis.analysis import initialize_engine_analysis

from analysis.models import Indicator, UserIndicator
from frontend.serializers.indicator import (
    IndicatorSerializer,
    UserIndicatorSerializer,
    UserIndicatorDetailSerializer
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


class UserIndicatorAPI(APIView):
    """API to return list of user indicators."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Fetch list of User Indicators."""
        user_indicator_queryset = UserIndicator.objects.filter(
            created_by=request.user
        )
        serializer = UserIndicatorDetailSerializer(
            user_indicator_queryset,
            many=True
        )

        return Response(
            status=200,
            data=serializer.data
        )

    def post(self, request, *args, **kwargs):
        """Create a new User Indicator."""
        serializer = UserIndicatorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(
                status=201,
                data=serializer.data
            )
        return Response(
            status=400,
            data=serializer.errors
        )


class FetchBandAPI(APIView):
    """API to return list of bands."""

    permission_classes = [IsAuthenticated]

    def _try_bands_from_image(self, asset_id):
        try:
            image = ee.Image(asset_id)
            return image.bandNames().getInfo()
        except Exception as e:
            print('Asset is not an image')
            return None

    def _try_bands_from_image_collection(self, asset_id):
        try:
            image_col = ee.ImageCollection(asset_id)
            image = ee.Image(image_col.first())
            return image.bandNames().getInfo()
        except Exception as e:
            print('Asset is not an image collection')
            return None

    def get_bands_from_gee_asset(self, asset_id):
        """Fetch bands from gee asset."""
        initialize_engine_analysis()
        return (
            self._try_bands_from_image(asset_id) or
            self._try_bands_from_image_collection(asset_id)
        )

    def post(self, request, *args, **kwargs):
        """Fetch band list from GEE Asset ID."""
        gee_asset_id = request.data.get('gee_asset_id')
        if not gee_asset_id:
            return Response(
                status=400,
                data={'error': 'GEE Asset ID is required.'}
            )

        bands = self.get_bands_from_gee_asset(gee_asset_id)
        if not bands:
            return Response(
                status=404,
                data={'error': 'No bands found for the provided GEE Asset ID.'}
            )

        return Response(
            status=200,
            data={'bands': bands}
        )
