from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet
from .views import IssueTypeViewSet


router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'issue_types', IssueTypeViewSet, basename='issue_type')

urlpatterns = [
    path('tickets-api/', include(router.urls)),
]
