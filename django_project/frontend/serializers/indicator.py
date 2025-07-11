# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Serializers for Indicator model
"""

from rest_framework import serializers

from analysis.models import Indicator


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
