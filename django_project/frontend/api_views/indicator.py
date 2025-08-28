# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Indicator APIs
"""

import ee
import uuid
import logging
from datetime import datetime, timezone, timedelta
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.gcs import get_gcs_client, generate_object_name, rasterio_read_gcs
from analysis.analysis import initialize_engine_analysis

from analysis.models import (
    Indicator,
    UserIndicator,
    UserGEEAsset,
    GEEAssetType,
    IndicatorSource
)
from frontend.models import AssetUploadItem
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

    def read_bands_from_session(self, session_id):
        """Read bands from previous upload session."""
        upload_items = AssetUploadItem.objects.filter(
            session=session_id
        )
        if not upload_items.exists():
            return None, None

        # for each upload item, check if exists in bucket
        gcs_bucket = get_gcs_client()
        files = []
        deleted_ids = []
        for item in upload_items:
            blob = gcs_bucket.blob(item.upload_path)
            if blob.exists():
                item.status = 'completed'
                item.progress = 100.0
                item.save()
                files.append(item)
            else:
                deleted_ids.append(item.id)
        
        if deleted_ids:
            AssetUploadItem.objects.filter(id__in=deleted_ids).delete()

        if not files:
            return None, None, None

        asset_type = (
            GEEAssetType.IMAGE if len(files) == 1 else
            GEEAssetType.IMAGE_COLLECTION
        )
        bands = []
        check_file = files[0]

        with rasterio_read_gcs(check_file.upload_path) as src:
            for i in range(src.count):
                desc = src.descriptions[i]
                if desc:
                    bands.append(desc)
                else:
                    bands.append(f'Band {i+1}')

        return bands, asset_type, files


    def post(self, request, *args, **kwargs):
        """Fetch band list from GEE Asset ID."""
        gee_asset_id = request.data.get('gee_asset_id', '')
        session_id = request.data.get('session_id', '')
        if not gee_asset_id and not session_id:
            return Response(
                status=400,
                data={'error': 'GEE Asset ID or session ID is required.'}
            )

        bands = []
        gee_asset_type = None
        start_date = None
        end_date = None
        files = []
        if gee_asset_id:
            (
                bands, gee_asset_type, start_date, end_date
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
        elif session_id:
            (
                bands, gee_asset_type, uploaded_files
            ) = self.read_bands_from_session(
                session_id
            )
            if not bands:
                return Response(
                    status=400,
                    data={
                        'error': (
                            'No valid files found for the provided session ID.'
                        )
                    }
                )
            
            files = [{
                'fileName': file.file_name,
                'fileSize': file.file_size,
                'uploadItemID': file.id
            } for file in uploaded_files]

        return Response(
            status=200,
            data={
                'bands': bands,
                'geeAssetType': gee_asset_type,
                'startDate': start_date,
                'endDate': end_date,
                'files': files
            }
        )


class GetSignedURLUploadAPI(APIView):
    """API to initiate upload."""

    permission_classes = [IsAuthenticated]
    SIGNED_URL_EXPIRATION_MINUTES = 3600
    MAX_FILE_SIZE = 1000 * 1024 * 1024  # 1000MB
    SIMPLE_UPLOAD_THRESHOLD = 10 * 1024 * 1024  # 10MB
    UPLOAD_TYPE = 'simple'

    def get_signed_url(self, blob, content_type, content_length):
        """Get signed url of GCS upload."""
        expiration = (
            datetime.now(tz=timezone.utc) +
            timedelta(minutes=self.SIGNED_URL_EXPIRATION_MINUTES)
        )

        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=expiration,
            method="PUT",
            content_type=content_type
        )

        delete_url = blob.generate_signed_url(
            version="v4",
            expiration=expiration,
            method="DELETE"
        )

        return signed_url, delete_url

    def post(self, request, *args, **kwargs):
        """Initiate upload of user asset."""
        file_name = request.data.get('fileName')
        object_name = generate_object_name(request.user.id, file_name)

        bucket = get_gcs_client()
        blob = bucket.blob(object_name)        

        # Set blob metadata
        blob.content_type = request.data.get('contentType')
        blob.metadata = {
            "uploaded_by": request.user.id,
            "original_filename": file_name,
            "upload_type": self.UPLOAD_TYPE,
            "uploaded_at": datetime.now(tz=timezone.utc).isoformat()
        }

        # Generate signed URL for PUT operation
        signed_url, delete_url = self.get_signed_url(
            blob, request.data.get('contentType'),
            request.data.get('contentLength')
        )

        session = request.data.get('sessionID', '')
        if not session:
            session = str(uuid.uuid4())
        upload_item = AssetUploadItem.objects.create(
            file_name=file_name,
            file_size=request.data.get('contentLength', 0),
            uploaded_by=request.user,
            session=session,
            upload_path=object_name
        )

        return Response(
            status=201,
            data={
                'sessionID': session,
                'signedUrl': signed_url,
                'deleteUrl': delete_url,
                'uploadItemID': upload_item.id
            }
        )
