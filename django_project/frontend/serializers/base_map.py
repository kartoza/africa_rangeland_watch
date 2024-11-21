# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for base_map
"""

from rest_framework import serializers

from frontend.models import BaseMap


class BaseMapSerializer(serializers.ModelSerializer):
    """Serializer for BaseMap model."""

    class Meta:  # noqa
        model = BaseMap
        fields = ['id', 'name', 'url']
