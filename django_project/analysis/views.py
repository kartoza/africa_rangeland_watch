from dashboard.models import Dashboard
from rest_framework import viewsets
from .models import UserAnalysisResults
from .serializer import UserAnalysisResultsSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from analysis.tasks import store_analysis_raster_output


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

            # store raster output using background task
            analysis_data = request.data.get('analysis_results').get('data')
            if analysis_data.get('analysisType', '') == 'Spatial':
                store_analysis_raster_output.delay(serializer.data.get('id'))

            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

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
