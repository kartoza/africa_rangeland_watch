# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for Eath Ranger
"""

from rest_framework import serializers
from django.core.cache import cache

from earthranger.models import EarthRangerEvents


class EarthRangerEventSerializer(serializers.ModelSerializer):
    """Serializer for Landscape model."""

    class Meta:  # noqa
        model = EarthRangerEvents
        fields = '__all__'
