# Create your views here.
from rest_framework import viewsets, permissions
from .models import Indicator, AlertSetting, IndicatorAlertHistory
from .serializers import (
    IndicatorSerializer,
    AlertSettingSerializer,
    IndicatorAlertHistorySerializer
)
from django.db.models import Prefetch


class IndicatorViewSet(viewsets.ModelViewSet):
    """ViewSet for performing CRUD operations on Indicator model."""
    serializer_class = IndicatorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Fetch indicators and prefetch their related
        alert settings for the logged-in user."""
        return Indicator.objects.prefetch_related(
            Prefetch(
                "alertsetting_set",
                queryset=AlertSetting.objects.filter(user=self.request.user)
            )
        )

    def get_serializer_context(self):
        """Pass the request context to the serializer."""
        return {'request': self.request}




class AlertSettingViewSet(viewsets.ModelViewSet):
    """ViewSet for performing CRUD operations on AlertSetting model."""
    queryset = AlertSetting.objects.all()
    serializer_class = AlertSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter queryset to only return alert settings
        for the logged-in user."""
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Associate the alert setting with the currently logged-in user."""
        serializer.save(user=self.request.user)


class IndicatorAlertHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for performing CRUD operations on
    IndicatorAlertHistory model."""
    queryset = IndicatorAlertHistory.objects.all()
    serializer_class = IndicatorAlertHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter queryset to only return alert
        histories for the logged-in user."""
        return self.queryset.filter(alert_setting__user=self.request.user)
