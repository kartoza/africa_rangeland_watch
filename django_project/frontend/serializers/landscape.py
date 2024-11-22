# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for Landscape
"""

from rest_framework import serializers

from analysis.models import Landscape


class LandscapeSerializer(serializers.ModelSerializer):
    """Serializer for Landscape model."""

    bbox = serializers.SerializerMethodField()

    def get_bbox(self, obj: Landscape):
        """Convert bbox polygon to its extent."""
        return obj.bbox.extent

    class Meta:  # noqa
        model = Landscape
        fields = ['id', 'name', 'bbox', 'zoom']
