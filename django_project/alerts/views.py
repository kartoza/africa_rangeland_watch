# Create your views here.
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Exists, OuterRef
from .models import (
    Indicator, AlertSetting, IndicatorAlertHistory,
    NotificationReadStatus
)
from .serializers import (
    IndicatorSerializer,
    AlertSettingSerializer,
    IndicatorAlertHistorySerializer
)
from django.db.models import Prefetch, Q
import logging
logger = logging.getLogger(__name__)


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
        logger.info(f"Creating alert setting for user: {self.request.user}")
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


class CategorizedAlertsView(viewsets.ModelViewSet):
    """
    A viewset for retrieving categorized alerts:
    personal, organization, system, or all.
    """
    serializer_class = IndicatorAlertHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = IndicatorAlertHistory.objects.all()

    @action(detail=False, methods=['get'], url_path='categorized')
    def categorized(self, request):
        """ Retrieve categorized alerts based
        on the user's profile and alert settings.
        """
        category = request.query_params.get('category', 'all')
        user = request.user
        user_org_ids = user.profile.organisations.values_list('id', flat=True)

        if category == 'personal':
            alerts = self.queryset.filter(alert_setting__user=user)

        elif category == 'organization':
            alerts = self.queryset.filter(
                alert_setting__user__profile__organisations__in=user_org_ids
            ).distinct()

        elif category == 'system':
            alerts = self.queryset.filter(alert_setting__user=None)

        else:  # all
            alerts = self.queryset.filter(
                Q(alert_setting__user=user) |
                Q(
                    alert_setting__user__profile__organisations__in=(
                        user_org_ids
                    )
                ) |
                Q(alert_setting__user=None)
            ).distinct()

        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)


class InAppNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for performing CRUD operations on
    IndicatorAlertHistory model for in-app notifications."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IndicatorAlertHistorySerializer

    def get_queryset(self):
        """Filter queryset to only return in-app alerts
        for the logged-in user."""
        user = self.request.user
        return IndicatorAlertHistory.objects.filter(
            alert_setting__user=self.request.user,
            alert_setting__in_app_alert=True
        ).annotate(
            is_read=Exists(
                NotificationReadStatus.objects.filter(
                    user=user,
                    notification=OuterRef('pk')
                )
            )
        ).order_by("-created_at")


class MarkNotificationsReadView(viewsets.ViewSet):
    """ViewSet for marking all notifications as read."""
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["post"])
    def mark_all(self, request):
        """Mark all unread notifications as read."""
        user = request.user

        unread_notifications = IndicatorAlertHistory.objects.filter(
            alert_setting__user=user,
            alert_setting__in_app_alert=True
        ).exclude(
            notificationreadstatus__user=user
        )

        NotificationReadStatus.objects.bulk_create([
            NotificationReadStatus(user=user, notification=n)
            for n in unread_notifications
        ], ignore_conflicts=True)

        return Response({"status": "All marked as read."})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        user = request.user
        notification = get_object_or_404(
            IndicatorAlertHistory,
            pk=pk,
            alert_setting__user=user,
            alert_setting__in_app_alert=True
        )

        NotificationReadStatus.objects.get_or_create(
            user=user, notification=notification
        )

        return Response(
            {
                "status": f"Notification {pk} marked as read"
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"])
    def mark_unread(self, request, pk=None):
        """Mark a single notification as unread."""
        user = request.user
        NotificationReadStatus.objects.filter(
            user=user
        ).delete()

        return Response(
            {
                "status": f"Notification {pk} marked as unread"
            }, status=200
        )
