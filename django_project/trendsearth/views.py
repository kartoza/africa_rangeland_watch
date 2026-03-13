# coding=utf-8
"""
Trends.Earth views for ARW.
"""
import json
import logging

from django.contrib.gis.db.models import Union as GeoUnion
from rest_framework import status as drf_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from analysis.models import LandscapeCommunity
from .models import (
    TrendsEarthSetting,
    TrendsEarthJob,
    TrendsEarthJobType,
    TrendsEarthJobStatus,
)
from .serializers import (
    TrendsEarthSettingSerializer,
    TrendsEarthJobSerializer,
)
from .tasks import submit_te_job

logger = logging.getLogger(__name__)


class TrendsEarthSettingViewSet(viewsets.ViewSet):
    """
    Manage Trends.Earth credentials for the authenticated user.

    GET  /api/trends-earth/settings/
        Returns the stored setting (or 404 if not configured).
    POST /api/trends-earth/settings/
        Create or update the setting.  Supply ``email`` and
        ``password`` to obtain a new refresh token; supply only
        ``email`` to update the email without re-authenticating.
    DELETE /api/trends-earth/settings/
        Remove the stored credentials.
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET – return current credentials status."""
        try:
            setting = TrendsEarthSetting.objects.get(user=request.user)
        except TrendsEarthSetting.DoesNotExist:
            return Response(
                {'detail': 'Trends.Earth credentials not configured.'},
                status=drf_status.HTTP_404_NOT_FOUND
            )
        serializer = TrendsEarthSettingSerializer(setting)
        return Response(serializer.data)

    def create(self, request):
        """
        POST – create or update credentials.

        If a ``password`` key is present in the request body,
        authenticate against the Trends.Earth API to obtain a
        refresh token.  Otherwise just save/update the email.
        """
        from analysis.external.trendsearth import (
            TrendsEarthAuthError,
            TrendsEarthAPIError,
            authenticate,
        )

        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()

        if not email:
            return Response(
                {'email': 'This field is required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        setting, _ = TrendsEarthSetting.objects.get_or_create(
            user=request.user,
            defaults={'email': email}
        )
        setting.email = email

        if password:
            try:
                _, refresh_token = authenticate(email, password)
                setting.refresh_token = refresh_token
            except TrendsEarthAuthError as exc:
                logger.warning(
                    'Trends.Earth authentication failed for user %s: %s',
                    request.user.pk, exc
                )
                return Response(
                    {'detail': 'Invalid email or password.'},
                    status=drf_status.HTTP_401_UNAUTHORIZED
                )
            except TrendsEarthAPIError as exc:
                logger.error(
                    'Trends.Earth auth error for user %s: %s',
                    request.user.pk, exc
                )
                return Response(
                    {
                        'detail':
                        'Error communicating with Trends.Earth service.'
                    },
                    status=drf_status.HTTP_502_BAD_GATEWAY
                )

        setting.save()
        serializer = TrendsEarthSettingSerializer(setting)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='delete')
    def remove(self, request):
        """DELETE – remove stored credentials."""
        deleted, _ = TrendsEarthSetting.objects.filter(
            user=request.user
        ).delete()
        if deleted:
            return Response(status=drf_status.HTTP_204_NO_CONTENT)
        return Response(
            {'detail': 'No credentials to delete.'},
            status=drf_status.HTTP_404_NOT_FOUND
        )


def _resolve_geojson_from_location_ids(location_ids: list) -> tuple:
    """
    Convert a list of LandscapeCommunity PKs into a merged GeoJSON
    geometry (MultiPolygon or Polygon) via a PostGIS Union aggregate.

    Returns ``(geojson_dict, error_response_or_none)``.
    If the IDs are invalid or no geometries are found, the second
    element is a DRF ``Response`` with an appropriate error status.
    """
    if not location_ids or not isinstance(location_ids, list):
        return None, Response(
            {'detail': '`location_ids` must be a non-empty list.'},
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    try:
        ids = [int(i) for i in location_ids]
    except (TypeError, ValueError):
        return None, Response(
            {'detail': '`location_ids` must be a list of integers.'},
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    result = LandscapeCommunity.objects.filter(
        id__in=ids
    ).aggregate(union=GeoUnion('geometry'))

    geom = result.get('union')
    if geom is None:
        return None, Response(
            {
                'detail': (
                    'No communities found for the provided '
                    '`location_ids`.'
                )
            },
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    return json.loads(geom.json), None


def _validate_year_range(year_initial, year_final) -> Response | None:
    """Validate year range. Returns error Response or None if valid."""
    if year_initial is None or year_final is None:
        return Response(
            {'detail': '`year_initial` and `year_final` are required.'},
            status=drf_status.HTTP_400_BAD_REQUEST
        )
    try:
        year_initial = int(year_initial)
        year_final = int(year_final)
    except (TypeError, ValueError):
        return Response(
            {'detail': '`year_initial` and `year_final` must be integers.'},
            status=drf_status.HTTP_400_BAD_REQUEST
        )
    if year_initial >= year_final:
        return Response(
            {'detail': '`year_initial` must be before `year_final`.'},
            status=drf_status.HTTP_400_BAD_REQUEST
        )
    return None


def _check_credentials(user) -> Response | None:
    """Check if user has Trends.Earth credentials.

    Returns error Response or None if credentials exist.
    """
    if not TrendsEarthSetting.objects.filter(user=user).exists():
        return Response(
            {
                'detail': (
                    'Trends.Earth credentials not configured. '
                    'Please save your credentials first.'
                )
            },
            status=drf_status.HTTP_403_FORBIDDEN
        )
    return None


class SubmitLdnJobView(APIView):
    """
    POST /api/trends-earth/submit/ldn/

    Submit an LDN (SDG 15.3.1) analysis job via Trends.Earth.

    Request body (JSON):
        location_ids – list of LandscapeCommunity PKs defining the AOI
        year_initial – first year of the analysis period (int)
        year_final   – last year of the analysis period (int)

    Returns:
        { "job_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        location_ids = request.data.get('location_ids')
        year_initial = request.data.get('year_initial')
        year_final = request.data.get('year_final')

        geojson, err = _resolve_geojson_from_location_ids(location_ids)
        if err is not None:
            return err

        error = _validate_year_range(year_initial, year_final)
        if error:
            return error

        error = _check_credentials(request.user)
        if error:
            return error

        year_initial = int(year_initial)
        year_final = int(year_final)

        job = TrendsEarthJob.objects.create(
            user=request.user,
            job_type=TrendsEarthJobType.LDN,
            status=TrendsEarthJobStatus.PENDING,
            geojson=geojson,
            year_initial=year_initial,
            year_final=year_final,
            task_name=f'LDN {year_initial}-{year_final}',
        )
        submit_te_job.delay(job.pk)

        return Response(
            {'job_id': job.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )


class TaskStatusView(APIView):
    """
    GET /api/trends-earth/job/<job_id>/

    Return the current status of a TrendsEarthJob.

    Response body (JSON):
        status           – PENDING | RUNNING | COMPLETED | FAILED
        execution_id     – Trends.Earth execution ID (or null)
        error            – error dict (or null)
        result           – result dict including cog_urls (or null)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        job = get_object_or_404(
            TrendsEarthJob,
            pk=job_id,
            user=request.user,
        )
        serializer = TrendsEarthJobSerializer(job)
        return Response(serializer.data)


class SubmitDroughtJobView(APIView):
    """
    POST /api/trends-earth/submit/drought/

    Submit a drought vulnerability analysis job via Trends.Earth.

    Request body (JSON):
        location_ids – list of LandscapeCommunity PKs defining the AOI
        year_initial – first year of the analysis period (int)
        year_final – last year of the analysis period
            (int, >= year_initial+5)

    Returns:
        { "job_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        location_ids = request.data.get('location_ids')
        year_initial = request.data.get('year_initial')
        year_final = request.data.get('year_final')

        geojson, err = _resolve_geojson_from_location_ids(location_ids)
        if err is not None:
            return err

        error = _validate_year_range(year_initial, year_final)
        if error:
            return error

        error = _check_credentials(request.user)
        if error:
            return error

        year_initial = int(year_initial)
        year_final = int(year_final)

        job = TrendsEarthJob.objects.create(
            user=request.user,
            job_type=TrendsEarthJobType.DROUGHT,
            status=TrendsEarthJobStatus.PENDING,
            geojson=geojson,
            year_initial=year_initial,
            year_final=year_final,
            task_name=f'Drought {year_initial}-{year_final}',
        )
        submit_te_job.delay(job.pk)

        return Response(
            {'job_id': job.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )


class SubmitUrbanizationJobView(APIView):
    """
    POST /api/trends-earth/submit/urbanization/

    Submit an SDG 11.3.1 urbanization analysis job via Trends.Earth.

    Request body (JSON):
        location_ids  – list of LandscapeCommunity PKs defining the AOI
        un_adju       – bool, apply UN adjustment (default false)
        isi_thr       – int 0-100, ISI threshold (default 30)
        ntl_thr       – int 0-100, NTL threshold (default 10)
        wat_thr       – int 0-100, water threshold (default 25)
        cap_ope       – int, cap openness in metres (default 200)
        pct_suburban  – float 0-1, suburban fraction (default 0.25)
        pct_urban     – float 0-1, urban fraction (default 0.50)

    Returns:
        { "job_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        location_ids = request.data.get('location_ids')

        geojson, err = _resolve_geojson_from_location_ids(location_ids)
        if err is not None:
            return err

        error = _check_credentials(request.user)
        if error:
            return error

        un_adju = bool(request.data.get('un_adju', False))
        try:
            isi_thr = int(request.data.get('isi_thr', 30))
            ntl_thr = int(request.data.get('ntl_thr', 10))
            wat_thr = int(request.data.get('wat_thr', 25))
            cap_ope = int(request.data.get('cap_ope', 200))
            pct_suburban = float(request.data.get('pct_suburban', 0.25))
            pct_urban = float(request.data.get('pct_urban', 0.50))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Threshold parameters must be numeric.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        job = TrendsEarthJob.objects.create(
            user=request.user,
            job_type=TrendsEarthJobType.URBANIZATION,
            status=TrendsEarthJobStatus.PENDING,
            geojson=geojson,
            task_name='Urbanization',
        )
        submit_te_job.delay(
            job.pk,
            un_adju=un_adju,
            isi_thr=isi_thr,
            ntl_thr=ntl_thr,
            wat_thr=wat_thr,
            cap_ope=cap_ope,
            pct_suburban=pct_suburban,
            pct_urban=pct_urban,
        )

        return Response(
            {'job_id': job.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )


class SubmitPopulationJobView(APIView):
    """
    POST /api/trends-earth/submit/population/

    Submit a population (GPW) download job via Trends.Earth.

    Request body (JSON):
        location_ids – list of LandscapeCommunity PKs defining the AOI
        year_initial – start year (int)
        year_final   – end year (int)

    Returns:
        { "job_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        location_ids = request.data.get('location_ids')
        year_initial = request.data.get('year_initial')
        year_final = request.data.get('year_final')

        geojson, err = _resolve_geojson_from_location_ids(location_ids)
        if err is not None:
            return err

        error = _validate_year_range(year_initial, year_final)
        if error:
            return error

        error = _check_credentials(request.user)
        if error:
            return error

        year_initial = int(year_initial)
        year_final = int(year_final)

        job = TrendsEarthJob.objects.create(
            user=request.user,
            job_type=TrendsEarthJobType.POPULATION,
            status=TrendsEarthJobStatus.PENDING,
            geojson=geojson,
            year_initial=year_initial,
            year_final=year_final,
            task_name=(
                f'Population {year_initial}'
                if year_initial == year_final
                else f'Population {year_initial}-{year_final}'
            ),
        )
        submit_te_job.delay(job.pk)

        return Response(
            {'job_id': job.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )
