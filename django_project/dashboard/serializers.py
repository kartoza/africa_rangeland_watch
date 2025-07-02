from analysis.serializer import UserAnalysisResultsSerializer
from rest_framework import serializers
from .models import Dashboard, DashboardWidget


class DashboardSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    analysis_results = UserAnalysisResultsSerializer(many=True)

    class Meta:
        model = Dashboard
        fields = [
            'uuid',
            'title',
            'created_by',
            'privacy_type',
            'config',
            'created_at',
            'updated_at',
            'owner',
            'analysis_results',
            'owner_name'
        ]

    def get_owner(self, obj):
        user = self.context['request'].user
        return obj.created_by == user

    def get_owner_name(self, obj):
        return (
            obj.created_by.first_name + ' ' + obj.created_by.last_name if
            obj.created_by else 'Unknown'
        )


class DashboardWidgetSerializer(serializers.ModelSerializer):
    last_updated = serializers.DateTimeField(source='updated_at')
    type = serializers.CharField(source='widget_type')
    content = serializers.CharField(source='text_content')
    size = serializers.SerializerMethodField()
    height = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    def get_size(self, obj):
        return obj.config.get('size', 2)

    def get_height(self, obj):
        return obj.config.get('height', 'medium')

    def get_data(self, obj):
        if obj.widget_type in ['table', 'chart']:
            return obj.analysis_result.analysis_results
        elif obj.widget_type == 'text':
            return obj.text_content
        elif obj.widget_type == 'map':
            raster_output_idx = obj.config.get('raster_output_idx', 0)
            rasters = obj.analysis_result.rasters
            if rasters and raster_output_idx < len(rasters):
                return rasters[raster_output_idx]
            else:
                return None
        return None

    class Meta:
        model = DashboardWidget
        fields = [
            'id',
            'type',
            'title',
            'size',
            'height',
            'data',
            'order',
            'config',
            'content',
            'analysis_result_id',
            'last_updated'
        ]


class DashboardDetailSerializer(serializers.ModelSerializer):
    last_updated = serializers.DateTimeField(source='updated_at')
    description = serializers.SerializerMethodField()
    widgets = serializers.SerializerMethodField()
    version = serializers.SerializerMethodField()

    def get_description(self, obj):
        return obj.config.get('dashboardDescription', '')

    def get_version(self, obj):
        return obj.config.get('version', '1.0')

    def get_widgets(self, obj):
        widgets = obj.widgets.select_related(
            'analysis_result'
        ).order_by('order').all()
        return DashboardWidgetSerializer(
            widgets,
            many=True,
            context=self.context
        ).data

    class Meta:
        model = Dashboard
        fields = [
            'uuid',
            'title',
            'description',
            'last_updated',
            'metadata',
            'version',
            'widgets'
        ]
