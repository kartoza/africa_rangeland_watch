import math
from rest_framework import viewsets
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
from .models import UserAnalysisResults
from .serializer import UserAnalysisResultsSerializer
from analysis.models import AnalysisRasterOutput
from analysis.tasks import (
    generate_temporal_analysis_raster_output,
    store_spatial_analysis_raster_output
)


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
