from rest_framework import serializers
from .models import UserAnalysisResults


class UserAnalysisResultsSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    dashboards = serializers.SerializerMethodField()

    class Meta:
        model = UserAnalysisResults
        fields = [
            'id',
            'created_by',
            'analysis_results',
            'created_at',
            'source',
            'dashboards'
        ]

    def get_created_by(self, obj):
        if obj.created_by:
            return {
                "id": obj.created_by.id,
                "name": (
                    obj.created_by.get_full_name() or
                    obj.created_by.username or
                    obj.created_by.email
                )
            }
        return None

    def get_dashboards(self, obj):
        return [{"id": d.uuid, "title": d.title} for d in obj.dashboards.all()]
