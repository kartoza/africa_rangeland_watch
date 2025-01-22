from rest_framework import serializers
from .models import UserAnalysisResults


class UserAnalysisResultsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnalysisResults
        fields = [
            'id',
            'created_by',
            'analysis_results',
            'created_at',
            'source'
        ]
