# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for Landscape
"""

from rest_framework import serializers
from django.core.cache import cache

from analysis.models import Landscape, LandscapeCommunity


class LandscapeSerializer(serializers.ModelSerializer):
    """Serializer for Landscape model."""

    bbox = serializers.SerializerMethodField()
    urls = serializers.SerializerMethodField()

    def get_bbox(self, obj: Landscape):
        """Convert bbox polygon to its extent."""
        return obj.bbox.extent

    def get_urls(self, obj: Landscape):
        """Get tile url."""
        urls = {}
        nrt_layers = self.context['nrt_layers']

        # get url for each nrt layer
        for layer_uuid in nrt_layers:
            url = cache.get(f'{layer_uuid}-{obj.id}', '')
            if url:
                urls[layer_uuid] = url

        return urls

    class Meta:  # noqa
        model = Landscape
        fields = ['id', 'name', 'bbox', 'zoom', 'urls']


class LandscapeCommunitySerializer(serializers.ModelSerializer):
    """Serializer for LandscapeCommunity model."""

    landscape_name = serializers.CharField(
        source="landscape.name", read_only=True
    )
    bbox = serializers.SerializerMethodField()

    class Meta:
        model = LandscapeCommunity
        fields = [
            "id",
            "community_name",
            "landscape",
            "landscape_name",
            "bbox"
        ]

    def get_bbox(self, obj: LandscapeCommunity):
        """Convert bbox polygon to its extent."""
        if obj.geometry:
            return obj.geometry.extent
        return None
