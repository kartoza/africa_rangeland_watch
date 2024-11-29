# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for InputLayer
"""

from rest_framework import serializers
from django.core.cache import cache
from cloud_native_gis.models import Layer, Style

from layers.models import InputLayer


class LayerSerializer(serializers.ModelSerializer):
    """Serializer for Layer model."""

    id = serializers.CharField(source='uuid')
    type = serializers.CharField(source='layer_type')
    group = serializers.SerializerMethodField()
    style = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    def get_group(self, obj: InputLayer):
        """Get group name."""
        return obj.group.name if obj.group else ''

    def get_style(self, obj: InputLayer):
        """Get layer style."""
        layer = Layer.objects.filter(unique_id=obj.uuid).first()
        if not layer:
            return None

        style = layer.styles.first()
        if style is None:
            style = layer.default_style
        
        if style is None:
            return None

        return style.style

    def get_url(self, obj: InputLayer):
        """Get tile url."""
        if obj.group.name not in ['baseline', 'near-real-time']:
            return obj.url

        # get from cache
        return cache.get(f'{str(obj.uuid)}', '')

    class Meta:  # noqa
        model = InputLayer
        fields = ['id', 'name', 'url', 'type', 'group', 'metadata', 'style']
