from django.urls import path
from .views import (
    DashboardCreateView,
    DashboardListCreateView,
    DashboardOwnerListView,
    DashboardRetrieveUpdateDestroyView,
    DashboardShareView,
    UpdateDashboardView,
    DashboardDetailView,
    DashboardWidgetDetailView
)


urlpatterns = [
    path(
        'dashboards/widgets/<int:pk>/',
        DashboardWidgetDetailView.as_view(),
        name='dashboard-widget-detail'
    ),
    path(
        'dashboards/',
        DashboardListCreateView.as_view(),
        name='dashboard-list-create'
    ),
    path(
        'dashboards/<uuid:pk>/',
        DashboardRetrieveUpdateDestroyView.as_view(),
        name='dashboard-detail'
    ),
    path(
        'dashboards/<uuid:pk>/share/',
        DashboardShareView.as_view(),
        name='dashboard-share'
    ),
    path(
        'dashboards/create/',
        DashboardCreateView.as_view(),
        name='dashboard-create'
    ),
    path(
        'dashboard-owners/',
        DashboardOwnerListView.as_view(),
        name='dashboard-owner-list'
    ),
    path(
        'dashboards/<uuid:uuid>/update/',
        UpdateDashboardView.as_view(),
        name='update-dashboard'
    ),
    path(
        'dashboards/<uuid:uuid>/detail/',
        DashboardDetailView.as_view(),
        name='dashboard-detail'
    ),
]
