# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for InputLayer
"""

from rest_framework import serializers

from layers.models import InputLayer


class LayerSerializer(serializers.ModelSerializer):
    """Serializer for Layer model."""

    id = serializers.CharField(source='uuid')
    type = serializers.CharField(source='layer_type')
    group = serializers.SerializerMethodField()

    def get_group(self, obj: InputLayer):
        """Get group name."""
        return obj.group.name if obj.group else ''

    class Meta:  # noqa
        model = InputLayer
        fields = ['id', 'name', 'url', 'type', 'group', 'metadata']
