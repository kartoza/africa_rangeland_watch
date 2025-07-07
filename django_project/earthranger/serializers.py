from rest_framework import serializers
from .models import EarthRangerEvents


class EarthRangerEventsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarthRangerEvents
        fields = ["earth_ranger_uuid", "data", "updated_at"]
