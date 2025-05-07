from rest_framework import serializers
from .models import InputLayer


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