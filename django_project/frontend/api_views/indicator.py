# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Indicator APIs
"""

import ee
import uuid
import logging
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from analysis.analysis import initialize_engine_analysis

from analysis.models import (
    Indicator,
    UserIndicator,
    UserGEEAsset,
    GEEAssetType,
    IndicatorSource
)
from frontend.serializers.indicator import (
    IndicatorSerializer,
    UserIndicatorSerializer,
    UserIndicatorDetailSerializer
)


logger = logging.getLogger(__name__)


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
        check_existing = UserIndicator.objects.filter(
            name=request.data.get('name')
        ).exists()
        if check_existing:
            return Response(
                status=400,
                data={
                    'error': (
                        'User Indicator with this name already exists.'
                    )
                }
            )

        # create metadata
        metadata = {
            'minValue': request.data.get('minValue'),
            'maxValue': request.data.get('maxValue'),
            'colors': request.data.get('colors'),
            'opacity': request.data.get('opacity'),
            'band_names': request.data.get('bands'),
            'start_date': request.data.get('startDate', None),
            'end_date': request.data.get('endDate', None)
        }

        # save UserGEEAsset with uuid
        gee_asset_id = str(uuid.uuid4())
        user_gee_asset = UserGEEAsset.objects.create(
            source=request.data.get('geeAssetID'),
            type=request.data.get('geeAssetType'),
            created_by=request.user,
            metadata=metadata,
            key=gee_asset_id
        )

        # create config
        config = {
            'reducer': request.data.get('reducer'),
            'bands': request.data.get('bands'),
            'selectedBand': request.data.get('selectedBand'),
            'asset_keys': [gee_asset_id],
            'gee_asset_type': request.data.get('geeAssetType')
        }

        # save user indicator
        indicator = UserIndicator.objects.create(
            name=request.data.get('name'),
            description=request.data.get('description', ''),
            variable_name=request.data.get('name'),
            source=IndicatorSource.OTHER,
            analysis_types=request.data.get('analysisTypes', []),
            temporal_resolutions=request.data.get('temporalResolutions', []),
            config=config,
            created_by=request.user,
        )

        return Response(
            status=201,
            data={
                'id': indicator.id,
                'geeAssetID': gee_asset_id,
                'userAssetID': user_gee_asset.id
            }
        )


class FetchBandAPI(APIView):
    """API to return list of bands."""

    permission_classes = [IsAuthenticated]

    def _try_bands_from_image(self, asset_id):
        try:
            image = ee.Image(asset_id)
            return image.bandNames().getInfo(), None, None
        except Exception as e:
            logger.error('Asset is not an image: %s', e)
            return None, None, None

    def _try_bands_from_image_collection(self, asset_id):
        try:
            image_col = ee.ImageCollection(asset_id)
            image = ee.Image(image_col.first())
            bands = image.bandNames().getInfo()

            # Get start and end dates
            start = ee.Date(image_col.aggregate_min('system:time_start'))
            end = ee.Date(image_col.aggregate_max('system:time_start'))

            start_date = start.format().getInfo()
            end_date = end.format().getInfo()

            return bands, start_date, end_date
        except Exception as e:
            logger.error('Asset is not an image collection: %s', e)
            return None, None, None

    def get_bands_from_gee_asset(self, asset_id):
        """Fetch bands from gee asset."""
        initialize_engine_analysis()

        bands, start_date, end_date = self._try_bands_from_image(asset_id)
        if bands:
            return (bands, GEEAssetType.IMAGE, start_date, end_date)

        (
            bands, start_date, end_date
        ) = self._try_bands_from_image_collection(asset_id)
        if bands:
            return (bands, GEEAssetType.IMAGE_COLLECTION, start_date, end_date)

        return None, None

    def post(self, request, *args, **kwargs):
        """Fetch band list from GEE Asset ID."""
        gee_asset_id = request.data.get('gee_asset_id')
        if not gee_asset_id:
            return Response(
                status=400,
                data={'error': 'GEE Asset ID is required.'}
            )

        (
            bands, geeAssetType, start_date, end_date
        ) = self.get_bands_from_gee_asset(gee_asset_id)
        if not bands:
            return Response(
                status=400,
                data={
                    'error': (
                        'Failed to fetch the asset. '
                        'Please ensure that the asset is public or '
                        'has been shared with ARW.'
                    )
                }
            )

        return Response(
            status=200,
            data={
                'bands': bands,
                'geeAssetType': geeAssetType,
                'startDate': start_date,
                'endDate': end_date
            }
        )
