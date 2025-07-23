from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from earthranger.models import EarthRangerEvents, EarthRangerSetting
from earthranger.utils import check_token


class EarthRangerEventsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarthRangerEvents
        fields = ["earth_ranger_uuid", "data", "updated_at"]


class EarthRangerEventsSimpleSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    event_type = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    reported_by = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    priority_label = serializers.SerializerMethodField()
    event_details = serializers.SerializerMethodField()

    class Meta:
        model = EarthRangerEvents
        fields = [
            "id", "event_type", "time",
            "reported_by", "location", "priority_label",
            "event_details"
        ]

    def get_id(self, obj):
        return obj.data.get("id") if obj.data else None

    def get_event_type(self, obj):
        return obj.data.get("event_type", "Unknown") if obj.data else "Unknown"

    def get_time(self, obj):
        return obj.data.get("time", "Unknown") if obj.data else "Unknown"

    def get_reported_by(self, obj):
        if not obj.data:
            return "Unknown"
        reported_by = obj.data.get("reported_by")
        if reported_by is not None and isinstance(reported_by, dict):
            return reported_by.get("name", "Unknown")
        return "Unknown"

    def get_location(self, obj):
        return obj.data.get("location", {}) if obj.data else {}

    def get_priority_label(self, obj):
        return obj.data.get(
            "priority_label", "Unknown"
        ) if obj.data else "Unknown"

    def get_event_details(self, obj):
        if not obj.data:
            return {
                "Comment": "Unknown",
                "Auc_vill_name": "Unknown"
            }

        event_details = obj.data.get("event_details")
        if event_details is not None and isinstance(event_details, dict):
            return {
                "Comment": event_details.get("Comment", "Unknown"),
                "Auc_vill_name": event_details.get("Auc_vill_name", "Unknown")
            }

        return {
            "Comment": "Unknown",
            "Auc_vill_name": "Unknown"
        }


class EarthRangerSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarthRangerSetting
        fields = [
            'id', 'name', 'url', 'token',
            'privacy', 'is_active', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, attrs):
        """
        Validate the token with the provided URL
        """
        url = attrs.get('url')
        token = attrs.get('token')

        # If this is an update, get existing values if not provided
        if self.instance:
            url = url or self.instance.url
            token = token or self.instance.token

        if url and token:
            if not check_token(url, token):
                raise ValidationError({
                    'token': (
                        'Invalid EarthRanger token/URL combination. '
                        'Please verify your credentials.'
                    )
                })

        return attrs


class EarthRangerSettingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = EarthRangerSetting
        fields = [
            'id', 'name', 'url',
            'privacy', 'is_active', 'created_at',
            'updated_at', 'token'
        ]
        read_only_fields = ['created_at', 'updated_at']
