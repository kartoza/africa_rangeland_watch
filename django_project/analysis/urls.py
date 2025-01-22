from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserAnalysisResultsViewSet

router = DefaultRouter()
router.register(r'user_analysis_results', UserAnalysisResultsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
