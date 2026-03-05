"""
URL patterns for the /api/analysis/ namespace.

These are included in core/urls.py under the 'api/analysis/' prefix so
that the full paths resolve as:

    GET/POST  /api/analysis/trendsearth/settings/
    DELETE    /api/analysis/trendsearth/settings/delete/
    POST      /api/analysis/trendsearth/submit/
    POST      /api/analysis/trendsearth/submit/drought/
    POST      /api/analysis/trendsearth/submit/urbanization/
    POST      /api/analysis/trendsearth/submit/population/
    GET       /api/analysis/task/<task_id>/
"""
from django.urls import path
from .views import (
    TrendsEarthSettingViewSet,
    SubmitLdnJobView,
    SubmitDroughtJobView,
    SubmitUrbanizationJobView,
    SubmitPopulationJobView,
    LdnTaskStatusView,
)

urlpatterns = [
    path(
        'trendsearth/settings/',
        TrendsEarthSettingViewSet.as_view({
            'get': 'list',
            'post': 'create',
        }),
        name='trendsearth-settings'
    ),
    path(
        'trendsearth/settings/delete/',
        TrendsEarthSettingViewSet.as_view({'delete': 'remove'}),
        name='trendsearth-settings-delete'
    ),
    path(
        'trendsearth/submit/',
        SubmitLdnJobView.as_view(),
        name='trendsearth-submit-ldn'
    ),
    path(
        'trendsearth/submit/drought/',
        SubmitDroughtJobView.as_view(),
        name='trendsearth-submit-drought'
    ),
    path(
        'trendsearth/submit/urbanization/',
        SubmitUrbanizationJobView.as_view(),
        name='trendsearth-submit-urbanization'
    ),
    path(
        'trendsearth/submit/population/',
        SubmitPopulationJobView.as_view(),
        name='trendsearth-submit-population'
    ),
    path(
        'task/<int:task_id>/',
        LdnTaskStatusView.as_view(),
        name='analysis-task-status'
    ),
]
