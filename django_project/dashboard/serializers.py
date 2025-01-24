from analysis.serializer import UserAnalysisResultsSerializer
from rest_framework import serializers
from .models import Dashboard


class DashboardSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    analysis_results = UserAnalysisResultsSerializer(many=True)

    class Meta:
        model = Dashboard
        fields = [
            'uuid',
            'title',
            'created_by',
            'privacy_type',
            'config',
            'created_at',
            'updated_at',
            'owner',
            'analysis_results',
        ]

    def get_owner(self, obj):
        user = self.context['request'].user
        return obj.created_by == user
