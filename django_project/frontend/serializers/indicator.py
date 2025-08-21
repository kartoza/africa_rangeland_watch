# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for Indicator model
"""

from rest_framework import serializers

from analysis.models import Indicator, UserIndicator


class IndicatorSerializer(serializers.ModelSerializer):
    """Serializer for Indicator model."""

    variable = serializers.CharField(source='variable_name')

    class Meta:  # noqa
        model = Indicator
        fields = [
            'name',
            'variable',
            'analysis_types',
            'temporal_resolutions',
            'source'
        ]


class UserIndicatorSerializer(serializers.ModelSerializer):
    """Serializer for User Indicator model."""

    variable = serializers.CharField(source='variable_name')

    class Meta:  # noqa
        model = UserIndicator
        fields = [
            'name',
            'description',
            'variable',
            'analysis_types',
            'temporal_resolutions',
            'source',
            'config',
            'metadata'
        ]


class UserIndicatorDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed User Indicator model."""

    variable = serializers.CharField(source='variable_name')
    layer = serializers.SerializerMethodField()

    def get_layer(self, obj: UserIndicator):
        """Return the layer associated with the User Indicator."""
        return {}

    class Meta:  # noqa
        model = UserIndicator
        fields = [
            'name',
            'variable',
            'analysis_types',
            'temporal_resolutions',
            'source',
            'layer'
        ]

