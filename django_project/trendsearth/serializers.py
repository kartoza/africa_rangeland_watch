# coding=utf-8
"""
Trends.Earth serializers for ARW.
"""
from rest_framework import serializers
from .models import TrendsEarthSetting, TrendsEarthJob


class TrendsEarthSettingSerializer(serializers.ModelSerializer):
    """Serializer for TrendsEarthSetting model."""

    has_credentials = serializers.SerializerMethodField()

    class Meta:
        model = TrendsEarthSetting
        fields = [
            'email',
            'has_credentials',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_has_credentials(self, obj: TrendsEarthSetting) -> bool:
        """Return whether the user has valid credentials."""
        return bool(obj.refresh_token)


class TrendsEarthJobSerializer(serializers.ModelSerializer):
    """Serializer for TrendsEarthJob model."""

    class Meta:
        model = TrendsEarthJob
        fields = [
            'id',
            'user',
            'execution_id',
            'job_type',
            'status',
            'geojson',
            'year_initial',
            'year_final',
            'task_name',
            'result',
            'error',
            'created_at',
            'updated_at',
            'completed_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'execution_id',
            'status',
            'result',
            'error',
            'created_at',
            'updated_at',
            'completed_at',
        ]
