# coding=utf-8
"""
Trends.Earth URL configuration for ARW.
"""
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    TrendsEarthSettingViewSet,
    SubmitLdnJobView,
    TaskStatusView,
    SubmitDroughtJobView,
    SubmitUrbanizationJobView,
    SubmitPopulationJobView,
)

router = DefaultRouter()
router.register(
    r'settings',
    TrendsEarthSettingViewSet,
    basename='trendsearth-settings'
)

urlpatterns = [
    path('submit/ldn/', SubmitLdnJobView.as_view(), name='submit-ldn'),
    path(
        'submit/drought/',
        SubmitDroughtJobView.as_view(),
        name='submit-drought'
    ),
    path(
        'submit/urbanization/',
        SubmitUrbanizationJobView.as_view(),
        name='submit-urbanization'
    ),
    path(
        'submit/population/',
        SubmitPopulationJobView.as_view(),
        name='submit-population'
    ),
    path('job/<int:job_id>/', TaskStatusView.as_view(), name='job-status'),
] + router.urls
