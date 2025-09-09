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

    gee_asset_type = serializers.SerializerMethodField()
    created_date = serializers.SerializerMethodField()
    selected_band = serializers.SerializerMethodField()
    reducer = serializers.SerializerMethodField()

    def get_gee_asset_type(self, obj: UserIndicator):
        """Return the asset type associated with the User Indicator."""
        return obj.config.get('gee_asset_type', 'Unknown')

    def get_created_date(self, obj: UserIndicator):
        """Return the created date associated with the User Indicator."""
        return obj.created_at.date().isoformat()

    def get_selected_band(self, obj: UserIndicator):
        """Return the selected band associated with the User Indicator."""
        return obj.config.get('selectedBand', 'Unknown')

    def get_reducer(self, obj: UserIndicator):
        """Return the reducer associated with the User Indicator."""
        return obj.config.get('reducer', 'Unknown')

    class Meta:  # noqa
        model = UserIndicator
        fields = [
            'id',
            'name',
            'description',
            'analysis_types',
            'temporal_resolutions',
            'gee_asset_type',
            'created_date',
            'selected_band',
            'reducer'
        ]
