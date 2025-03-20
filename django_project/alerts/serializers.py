from rest_framework import serializers
from .models import Indicator, AlertSetting, IndicatorAlertHistory


class IndicatorSerializer(serializers.ModelSerializer):
    """Serializer for the Indicator model."""

    class Meta:
        model = Indicator
        fields = ['id', 'name']


class AlertSettingSerializer(serializers.ModelSerializer):
    """Serializer for the AlertSetting model."""

    indicator = IndicatorSerializer(read_only=True)
    indicator_id = serializers.PrimaryKeyRelatedField(
        queryset=Indicator.objects.all(),
        source='indicator',
        write_only=True
    )

    class Meta:
        model = AlertSetting
        fields = [
            'id', 'name', 'indicator', 'indicator_id', 'enable_alert',
            'last_alert', 'threshold_comparison', 'threshold_value',
            'anomaly_detection_alert', 'email_alert', 'in_app_alert',
            'created_at', 'updated_at', 'user'
        ]
        read_only_fields = ['created_at', 'updated_at']


class IndicatorAlertHistorySerializer(serializers.ModelSerializer):
    """Serializer for the IndicatorAlertHistory model."""

    alert_setting = AlertSettingSerializer(read_only=True)
    alert_setting_id = serializers.PrimaryKeyRelatedField(
        queryset=AlertSetting.objects.all(),
        source='alert_setting',
        write_only=True
    )

    class Meta:
        model = IndicatorAlertHistory
        fields = [
            'id',
            'text',
            'alert_setting',
            'alert_setting_id',
            'created_at'
        ]
        read_only_fields = ['created_at']
