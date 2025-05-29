from rest_framework import serializers
from django.conf import settings
from django.urls import reverse

from cloud_native_gis.models import Layer, LayerType
from .models import UserAnalysisResults


class UserAnalysisResultsSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    dashboards = serializers.SerializerMethodField()
    raster_output_list = serializers.SerializerMethodField()

    class Meta:
        model = UserAnalysisResults
        fields = [
            'id',
            'created_by',
            'analysis_results',
            'created_at',
            'source',
            'dashboards',
            'raster_output_list'
        ]

    def get_created_by(self, obj):
        if obj.created_by:
            return {
                "id": obj.created_by.id,
                "name": (
                    obj.created_by.get_full_name() or
                    obj.created_by.username or
                    obj.created_by.email
                )
            }
        return None

    def get_dashboards(self, obj):
        return [{"id": d.uuid, "title": d.title} for d in obj.dashboards.all()]

    def get_raster_output_list(self, obj):
        results = []
        for item in obj.raster_outputs.all():
            result = {
                "id": item.uuid,
                "name": item.name,
                "size": item.size,
                "status": item.status,
                "analysis": item.analysis
            }
            layer = Layer.objects.filter(
                unique_id=item.uuid,
                layer_type=LayerType.RASTER_TILE
            ).first()
            if layer:
                result['url'] = self._make_cog_url(layer.unique_id)
                metadata = layer.metadata or {}
                result['bounds'] = metadata.get('bounds', None)

            results.append(result)
        return results

    def _make_cog_url(self, layer_uuid: str):
        base_url = settings.DJANGO_BACKEND_URL
        if base_url.endswith('/'):
            base_url = base_url[:-1]
        return (
            f'cog://{base_url}' +
            reverse('serve-cog', kwargs={
                'layer_uuid': layer_uuid,
            })
        )
