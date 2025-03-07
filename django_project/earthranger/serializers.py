from rest_framework import serializers
from .models import EarthRangerEvents


class EarthRangerEventsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarthRangerEvents
        fields = ["name", "data", "last_updated"]
