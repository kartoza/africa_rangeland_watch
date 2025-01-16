from rest_framework import serializers
from .models import UserSession


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = [
            'last_page',
            'activity_data',
            'analysis_state',
            'last_updated'
        ]