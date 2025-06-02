from dashboard.models import Dashboard
from rest_framework import viewsets
from django.shortcuts import get_object_or_404
from django.http import Http404, StreamingHttpResponse
from .models import UserAnalysisResults
from .serializer import UserAnalysisResultsSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from analysis.models import AnalysisRasterOutput
from analysis.tasks import (
    generate_temporal_analysis_raster_output,
    store_spatial_analysis_raster_output
)
from analysis.utils import get_gdrive_file


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

        file = get_gdrive_file(raster_output.raster_filename)
        if not file:
            raise Http404("File not found in Google Drive")
        else:
            # Download and stream the file
            def file_iterator():
                file.FetchContent()
                # Read in 8MB chunks
                while chunk := file.content.read(8 * 1024 * 1024):
                    yield chunk

            response = StreamingHttpResponse(
                file_iterator(),
                content_type='image/tiff'
            )
            response['Content-Disposition'] = (
                f'attachment; filename="{raster_output.name}"'
            )
            return response

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
