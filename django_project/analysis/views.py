import math
import logging
from rest_framework import viewsets, status as drf_status
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import Http404, FileResponse
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from cloud_native_gis.models import (
    Layer,
    LayerType,
    LayerUpload
)

from dashboard.models import Dashboard
from .models import (
    UserAnalysisResults,
    TrendsEarthSetting,
    AnalysisTask,
    AnalysisTaskSource,
    AnalysisTaskType,
)
from .serializer import (
    UserAnalysisResultsSerializer,
    TrendsEarthSettingSerializer,
)
from analysis.models import AnalysisRasterOutput
from analysis.tasks import (
    generate_temporal_analysis_raster_output,
    store_spatial_analysis_raster_output,
    submit_te_job,
    submit_drought_te_job,
    submit_urbanization_te_job,
    submit_population_te_job,
)

logger = logging.getLogger(__name__)


class UserAnalysisResultsViewSet(viewsets.ModelViewSet):
    queryset = UserAnalysisResults.objects.all()
    serializer_class = UserAnalysisResultsSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            analysis_results=self.request.data.get('analysis_results')
        )

    @action(detail=False, methods=['get'])
    def fetch_analysis_results(self, request):
        analysis_results = UserAnalysisResults.objects.filter(
            created_by=request.user
        ).order_by('-created_at')
        serializer = self.get_serializer(analysis_results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def save_analysis_results(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)

            # store raster output for temporal using background task
            analysis_data = request.data.get('analysis_results').get('data')
            if analysis_data.get('analysisType', '') == 'Temporal':
                result_obj = UserAnalysisResults.objects.get(
                    id=serializer.data.get('id')
                )
                raster_dicts = (
                    AnalysisRasterOutput.from_temporal_analysis_input(
                        analysis_data
                    )
                )

                # Iterate for each period and check if already exist
                output_obj_list = []
                new_output_list = []
                for input_dict in raster_dicts:
                    # check if output already exists
                    output_obj = AnalysisRasterOutput.objects.filter(
                        analysis=input_dict
                    ).last()
                    if output_obj is None:
                        output_obj = AnalysisRasterOutput.objects.create(
                            name=AnalysisRasterOutput.generate_name(
                                input_dict
                            ),
                            status='PENDING',
                            analysis=input_dict
                        )
                        new_output_list.append(output_obj)
                    output_obj_list.append(output_obj)
                result_obj.raster_outputs.set(output_obj_list)

                for new_output in new_output_list:
                    generate_temporal_analysis_raster_output\
                        .delay(new_output.uuid)
            elif analysis_data.get('analysisType', '') == 'Spatial':
                result_obj = UserAnalysisResults.objects.get(
                    id=serializer.data.get('id')
                )
                raster_dict = (
                    AnalysisRasterOutput.from_spatial_analysis_input(
                        analysis_data
                    )
                )
                should_generate = False
                # check if output already exists
                output_obj = AnalysisRasterOutput.objects.filter(
                    analysis=raster_dict
                ).last()
                if output_obj is None:
                    output_obj = AnalysisRasterOutput.objects.create(
                        name=AnalysisRasterOutput.generate_name(
                            raster_dict
                        ),
                        status='PENDING',
                        analysis=raster_dict
                    )
                    should_generate = True
                result_obj.raster_outputs.set([output_obj])
                if should_generate:
                    store_spatial_analysis_raster_output.delay(
                        output_obj.uuid
                    )

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    @action(
        detail=False,
        methods=['get'],
        url_path=r"download_raster_output/(?P<uuid>[0-9a-f-]+)"
    )
    def download_raster_output(self, request, uuid):
        raster_output = get_object_or_404(
            AnalysisRasterOutput,
            uuid=uuid
        )

        layer = Layer.objects.filter(
            unique_id=raster_output.uuid,
            layer_type=LayerType.RASTER_TILE
        ).first()

        if not layer:
            raise Http404("File not found.")
        else:
            # Fetch the LayerUpload object associated with the layer
            layer_upload = LayerUpload.objects.filter(
                layer=layer
            ).last()

            file = None
            if layer_upload:
                files = layer_upload.files
                if files:
                    # Get the first file from the LayerUpload
                    file = layer_upload.filepath(files[0])

            if not layer.is_ready or not file:
                raise Http404("File is not ready.")

            response = FileResponse(
                open(file, 'rb'),
                content_type='image/tiff'
            )
            response['Content-Disposition'] = (
                f'attachment; filename="{raster_output.name}"'
            )
            return response

    @action(detail=False, methods=['get'])
    def fetch(self, request):
        """Fetch analysis results with pagination."""
        page = request.GET.get('page', 1)
        limit = request.GET.get('limit', 10)
        search = request.GET.get('search', '')
        queryset = UserAnalysisResults.objects.filter(
            created_by=request.user
        )
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        queryset = queryset.order_by('-created_at')

        # Pagination logic
        total_count = queryset.count()
        total_pages = math.ceil(total_count / int(limit))
        if int(page) < 1 or int(page) > total_pages:
            return Response({
                'results': [],
                'count': 0,
                'total_pages': 0,
                'current_page': int(page)
            })
        if total_count == 0:
            return Response({
                'results': [],
                'count': 0,
                'total_pages': 0,
                'current_page': int(page)
            })

        start = (int(page) - 1) * int(limit)
        end = start + int(limit)
        paginated_results = queryset[start:end]
        serializer = self.get_serializer(paginated_results, many=True)
        return Response({
            'results': serializer.data,
            'count': total_count,
            'total_pages': total_pages,
            'current_page': int(page)
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        # Remove the analysis from associated dashboards
        dashboards = Dashboard.objects.filter(analysis_results=instance)
        for dashboard in dashboards:
            dashboard.analysis_results.remove(instance)

        # Delete the analysis
        instance.delete()
        return Response(
            {
                "message": "Analysis deleted successfully"
            }, status=204)


class TrendsEarthSettingViewSet(viewsets.ViewSet):
    """
    Manage Trends.Earth credentials for the authenticated user.

    GET  /api/analysis/trendsearth/settings/
        Returns the stored setting (or 404 if not configured).
    POST /api/analysis/trendsearth/settings/
        Create or update the setting.  Supply ``email`` and
        ``password`` to obtain a new refresh token; supply only
        ``email`` to update the email without re-authenticating.
    DELETE /api/analysis/trendsearth/settings/
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
                return Response(
                    {'detail': str(exc)},
                    status=drf_status.HTTP_401_UNAUTHORIZED
                )
            except TrendsEarthAPIError as exc:
                logger.error(
                    'Trends.Earth auth error for user %s: %s',
                    request.user.pk, exc
                )
                return Response(
                    {'detail': str(exc)},
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


class SubmitLdnJobView(APIView):
    """
    POST /api/analysis/trendsearth/submit/

    Submit an LDN (SDG 15.3.1) analysis job via Trends.Earth.

    Request body (JSON):
        geojson    – GeoJSON geometry of the area of interest
        year_start – first year of the analysis period (int)
        year_end   – last year of the analysis period (int)

    Returns:
        { "task_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        geojson = request.data.get('geojson')
        year_start = request.data.get('year_start')
        year_end = request.data.get('year_end')

        if not geojson:
            return Response(
                {'detail': '`geojson` is required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year_start is None or year_end is None:
            return Response(
                {'detail': '`year_start` and `year_end` are required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        try:
            year_start = int(year_start)
            year_end = int(year_end)
        except (TypeError, ValueError):
            return Response(
                {'detail': '`year_start` and `year_end` must be integers.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year_start >= year_end:
            return Response(
                {'detail': '`year_start` must be before `year_end`.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        if not TrendsEarthSetting.objects.filter(
            user=request.user
        ).exists():
            return Response(
                {
                    'detail': (
                        'Trends.Earth credentials not configured. '
                        'Please save your credentials first.'
                    )
                },
                status=drf_status.HTTP_403_FORBIDDEN
            )

        task = AnalysisTask.objects.create(
            submitted_by=request.user,
            source=AnalysisTaskSource.TRENDS_EARTH,
            analysis_inputs={
                'geojson': geojson,
                'year_start': year_start,
                'year_end': year_end,
            },
        )
        submit_te_job.delay(task.pk)

        return Response(
            {'task_id': task.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )


class LdnTaskStatusView(APIView):
    """
    GET /api/analysis/task/<task_id>/

    Return the current status of an AnalysisTask.

    Response body (JSON):
        status           – PENDING | RUNNING | COMPLETED | FAILED
        te_execution_id  – Trends.Earth execution ID (or null)
        error            – error dict (or null)
        result           – result dict including cog_urls (or null)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        task = get_object_or_404(
            AnalysisTask,
            pk=task_id,
            submitted_by=request.user,
        )
        return Response({
            'task_id': task.pk,
            'status': task.status,
            'source': task.source,
            'task_type': task.task_type,
            'te_execution_id': task.te_execution_id,
            'error': task.error,
            'result': task.result,
            'created_at': task.created_at,
            'updated_at': task.updated_at,
            'completed_at': task.completed_at,
        })


class SubmitDroughtJobView(APIView):
    """
    POST /api/analysis/trendsearth/submit/drought/

    Submit a drought vulnerability analysis job via Trends.Earth.

    Request body (JSON):
        geojson    – GeoJSON geometry of the area of interest
        year_start – first year of the analysis period (int)
        year_end   – last year of the analysis period (int)

    Returns:
        { "task_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        geojson = request.data.get('geojson')
        year_start = request.data.get('year_start')
        year_end = request.data.get('year_end')

        if not geojson:
            return Response(
                {'detail': '`geojson` is required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year_start is None or year_end is None:
            return Response(
                {'detail': '`year_start` and `year_end` are required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        try:
            year_start = int(year_start)
            year_end = int(year_end)
        except (TypeError, ValueError):
            return Response(
                {
                    'detail': (
                        '`year_start` and `year_end` must be integers.'
                    )
                },
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year_start >= year_end:
            return Response(
                {'detail': '`year_start` must be before `year_end`.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        if not TrendsEarthSetting.objects.filter(
            user=request.user
        ).exists():
            return Response(
                {
                    'detail': (
                        'Trends.Earth credentials not configured. '
                        'Please save your credentials first.'
                    )
                },
                status=drf_status.HTTP_403_FORBIDDEN
            )

        task = AnalysisTask.objects.create(
            submitted_by=request.user,
            source=AnalysisTaskSource.TRENDS_EARTH,
            task_type=AnalysisTaskType.DROUGHT,
            analysis_inputs={
                'geojson': geojson,
                'year_start': year_start,
                'year_end': year_end,
            },
        )
        submit_drought_te_job.delay(task.pk)

        return Response(
            {'task_id': task.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )


class SubmitUrbanizationJobView(APIView):
    """
    POST /api/analysis/trendsearth/submit/urbanization/

    Submit an SDG 11.3.1 urbanization analysis job via Trends.Earth.

    Request body (JSON):
        geojson    – GeoJSON geometry of the area of interest
        year_start – first year of the analysis period (int)
        year_end   – last year of the analysis period (int)

    Returns:
        { "task_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        geojson = request.data.get('geojson')
        year_start = request.data.get('year_start')
        year_end = request.data.get('year_end')

        if not geojson:
            return Response(
                {'detail': '`geojson` is required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year_start is None or year_end is None:
            return Response(
                {'detail': '`year_start` and `year_end` are required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        try:
            year_start = int(year_start)
            year_end = int(year_end)
        except (TypeError, ValueError):
            return Response(
                {
                    'detail': (
                        '`year_start` and `year_end` must be integers.'
                    )
                },
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year_start >= year_end:
            return Response(
                {'detail': '`year_start` must be before `year_end`.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        if not TrendsEarthSetting.objects.filter(
            user=request.user
        ).exists():
            return Response(
                {
                    'detail': (
                        'Trends.Earth credentials not configured. '
                        'Please save your credentials first.'
                    )
                },
                status=drf_status.HTTP_403_FORBIDDEN
            )

        task = AnalysisTask.objects.create(
            submitted_by=request.user,
            source=AnalysisTaskSource.TRENDS_EARTH,
            task_type=AnalysisTaskType.URBANIZATION,
            analysis_inputs={
                'geojson': geojson,
                'year_start': year_start,
                'year_end': year_end,
            },
        )
        submit_urbanization_te_job.delay(task.pk)

        return Response(
            {'task_id': task.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )


class SubmitPopulationJobView(APIView):
    """
    POST /api/analysis/trendsearth/submit/population/

    Submit a population (GPW) download job via Trends.Earth.

    Request body (JSON):
        geojson – GeoJSON geometry of the area of interest
        year    – single target year (int)

    Returns:
        { "task_id": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        geojson = request.data.get('geojson')
        year = request.data.get('year')

        if not geojson:
            return Response(
                {'detail': '`geojson` is required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        if year is None:
            return Response(
                {'detail': '`year` is required.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        try:
            year = int(year)
        except (TypeError, ValueError):
            return Response(
                {'detail': '`year` must be an integer.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )

        if not TrendsEarthSetting.objects.filter(
            user=request.user
        ).exists():
            return Response(
                {
                    'detail': (
                        'Trends.Earth credentials not configured. '
                        'Please save your credentials first.'
                    )
                },
                status=drf_status.HTTP_403_FORBIDDEN
            )

        task = AnalysisTask.objects.create(
            submitted_by=request.user,
            source=AnalysisTaskSource.TRENDS_EARTH,
            task_type=AnalysisTaskType.POPULATION,
            analysis_inputs={
                'geojson': geojson,
                'year': year,
            },
        )
        submit_population_te_job.delay(task.pk)

        return Response(
            {'task_id': task.pk},
            status=drf_status.HTTP_202_ACCEPTED
        )
