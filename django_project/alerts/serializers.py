from rest_framework import serializers
from .models import (
    Indicator, AlertSetting, IndicatorAlertHistory,
    NotificationReadStatus
)
from analysis.models import LandscapeCommunity


class AlertSettingSerializer(serializers.ModelSerializer):
    """Serializer for the AlertSetting model."""

    indicator = serializers.PrimaryKeyRelatedField(
        queryset=Indicator.objects.all()
    )
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    location = serializers.PrimaryKeyRelatedField(
        queryset=LandscapeCommunity.objects.all(),
        required=False,
    )

    class Meta:
        model = AlertSetting
        fields = [
            'id', 'name', 'indicator', 'enable_alert',
            'last_alert', 'threshold_comparison', 'threshold_value',
            'anomaly_detection_alert', 'email_alert', 'in_app_alert',
            'created_at', 'updated_at', 'user', 'location', 
            'analysis_type', 'reference_period'
        ]
        read_only_fields = ['created_at', 'updated_at']


class IndicatorSerializer(serializers.ModelSerializer):
    """Serializer for the Indicator model."""

    alert_settings = serializers.SerializerMethodField()

    class Meta:
        model = Indicator
        fields = ['id', 'name', 'alert_settings']

    def get_alert_settings(self, obj):
        """Fetch the alert settings related to this
        indicator for the current user."""
        user = self.context['request'].user
        alert_settings = obj.alertsetting_set.filter(user=user)
        return AlertSettingSerializer(alert_settings, many=True).data


class IndicatorAlertHistorySerializer(serializers.ModelSerializer):
    """Serializer for the IndicatorAlertHistory model."""

    alert_setting = AlertSettingSerializer(read_only=True)
    alert_setting_id = serializers.PrimaryKeyRelatedField(
        queryset=AlertSetting.objects.all(),
        source='alert_setting',
        write_only=True
    )
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = IndicatorAlertHistory
        fields = [
            'id',
            'text',
            'alert_setting',
            'alert_setting_id',
            'created_at',
            'is_read'
        ]
        read_only_fields = ['created_at']

    def get_is_read(self, obj):
        """Check if the alert history is read."""
        user = self.context["request"].user
        return NotificationReadStatus.objects.filter(
            user=user, notification=obj
        ).exists()


class NotificationReadStatusSerializer(serializers.ModelSerializer):
    """Serializer for the NotificationReadStatus model."""
    class Meta:
        model = NotificationReadStatus
        fields = ["user", "notification", "read_at"]
        read_only_fields = ["read_at"]
