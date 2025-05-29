from rest_framework import serializers
from .models import InputLayer, ExternalLayer


class InputLayerSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = InputLayer
        fields = [
            "uuid", "name", "layer_type", "metadata", "url", "download_url",
        ]

    def get_download_url(self, obj):
        if obj.metadata.get("cog_downloaded") and obj.url:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.url) if request else obj.url
        return None


class ExternalLayerDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for ExternalLayer model to display detailed information.
    """
    source = serializers.CharField(source="source.name", read_only=True)
    file = serializers.FileField(use_url=True)

    class Meta:
        """Meta class"""
        model = ExternalLayer
        fields = [
            "uuid", "name", "layer_type", "source", "file",
            "metadata", "is_public", "is_auto_published", "created_at"
        ]
