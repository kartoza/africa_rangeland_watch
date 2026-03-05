from rest_framework import serializers

from .models import UserAnalysisResults, TrendsEarthSetting


class UserAnalysisResultsSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    dashboards = serializers.SerializerMethodField()
    raster_output_list = serializers.SerializerMethodField()

    class Meta:
        model = UserAnalysisResults
        fields = [
            'id',
            'created_by',
            'analysis_results',
            'created_at',
            'source',
            'dashboards',
            'raster_output_list',
            'name',
            'description'
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

    def get_raster_output_list(self, obj):
        return obj.rasters


class TrendsEarthSettingSerializer(serializers.ModelSerializer):
    """Serializer for per-user Trends.Earth credentials.

    The refresh_token field is write-only so it is never returned in
    GET responses (the frontend only needs to know whether a token exists,
    not its value).
    """

    has_credentials = serializers.SerializerMethodField(
        help_text='True if a refresh token is stored for this user.'
    )

    class Meta:
        model = TrendsEarthSetting
        fields = ['id', 'email', 'refresh_token', 'has_credentials',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'has_credentials', 'created_at',
                            'updated_at']
        extra_kwargs = {
            'refresh_token': {'write_only': True, 'required': False},
        }

    def get_has_credentials(self, obj: TrendsEarthSetting) -> bool:
        """Return True when a refresh token is stored."""
        return bool(obj.refresh_token)
