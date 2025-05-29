# serializers.py
from rest_framework import serializers
from .models import ExternalLayer


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
