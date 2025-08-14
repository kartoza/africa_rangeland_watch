from django.contrib import admin, messages
from django.contrib.gis.admin import OSMGeoAdmin
from django.http import StreamingHttpResponse, Http404
from django.urls import re_path, reverse
from django.utils.html import format_html

from .models import (
    Analysis,
    InterventionArea,
    Landscape,
    LandscapeCommunity,
    UserAnalysisResults,
    GEEAsset,
    AnalysisResultsCache,
    AnalysisRasterOutput,
    AnalysisTask,
    Project,
    Indicator,
    UserIndicator,
    UserGEEAsset
)
from analysis.utils import get_gdrive_file
from analysis.tasks import (
    generate_temporal_analysis_raster_output,
    store_spatial_analysis_raster_output
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin for Project model."""

    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Analysis)
class AnalysisAdmin(OSMGeoAdmin):
    list_display = (
        'uuid', 'analysis_type', 'indicator', 'intervention_area',
        'temporal_resolution', 'created_at', 'updated_at')
    list_filter = (
        'analysis_type', 'temporal_resolution', 'created_at', 'updated_at')
    search_fields = ('uuid', 'indicator__name', 'intervention_area__name')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('analysis_type', 'indicator', 'intervention_area')
        }),
        ('Resolution & Period', {
            'fields': (
                'temporal_resolution', 'reference_period_start',
                'reference_period_end')
        }),
        ('Spatial Data', {
            'fields': ('geom',),
            'classes': ('collapse',),
        }),
        ('User Information', {
            'fields': ('created_by',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    map_template = 'gis/admin/osm.html'
    default_lon = 0
    default_lat = 0
    default_zoom = 2


@admin.register(InterventionArea)
class InterventionAreaAdmin(OSMGeoAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('name',)
        }),
        ('Spatial Data', {
            'fields': ('geom',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    map_template = 'gis/admin/osm.html'
    default_lon = 0
    default_lat = 0
    default_zoom = 2


def fetch_landscape_area(modeladmin, request, queryset):
    """Fetch all Landscape Area objects for a given queryset."""
    for landscape in queryset:
        landscape.fetch_areas()


@admin.register(Landscape)
class LandscapeAdmin(OSMGeoAdmin):
    """Admin for landscape model."""

    list_display = ('name', 'project_names')
    search_fields = ('name',)

    map_template = 'gis/admin/osm.html'
    actions = [fetch_landscape_area]


@admin.register(LandscapeCommunity)
class LandscapeCommunityAdmin(OSMGeoAdmin):
    """Admin for LandscapeCommunity model."""

    list_display = ('landscape', 'community_id', 'community_name',)
    search_fields = ('community_name',)
    list_filter = ('landscape',)

    map_template = 'gis/admin/osm.html'


def fix_analysis_name_desc(modeladmin, request, queryset):
    """Fix the name and description of analysis results."""
    for result in queryset:
        data = (
            result.analysis_results.get('data', {}) if
            result.analysis_results else {}
        )
        if not result.name:
            result.name = result._get_name(data)
        if not result.description:
            result.description = result._get_description(data)
        result.save()
    modeladmin.message_user(
        request,
        f"Updated {queryset.count()} analysis results.",
        level=messages.SUCCESS
    )


class UserAnalysisResultsAdmin(admin.ModelAdmin):
    list_display = ('created_by', 'name', 'source', 'created_at')
    search_fields = ('created_by__username', 'source',)
    list_filter = ('source',)
    actions = [fix_analysis_name_desc]

    def view_analysis_results(self, obj):
        return str(obj.analysis_results)[:100]
    view_analysis_results.short_description = 'Analysis Results...'


admin.site.register(UserAnalysisResults, UserAnalysisResultsAdmin)


@admin.register(GEEAsset)
class GEEAssetAdmin(admin.ModelAdmin):
    """Admin for GEEAsset model."""

    list_display = ('key', 'type', 'source',)
    search_fields = ('key', 'source',)
    list_filter = ('type',)


@admin.register(AnalysisResultsCache)
class AnalysisResultsCacheAdmin(admin.ModelAdmin):
    """Admin for AnalysisResultsCache model."""

    list_display = ('id', 'expired_at',)


def generate_raster_output(modeladmin, request, queryset):
    """Trigger task to generate raster for a given queryset."""
    for raster in queryset:
        if raster.status == 'RUNNING':
            continue
        if raster.analysis['analysisType'] == 'Temporal':
            generate_temporal_analysis_raster_output.delay(
                raster.uuid
            )
        elif raster.analysis['analysisType'] == 'Spatial':
            store_spatial_analysis_raster_output.delay(
                raster.uuid
            )
    modeladmin.message_user(
        request,
        "Raster generation tasks have been triggered!",
        level=messages.SUCCESS
    )


@admin.register(AnalysisRasterOutput)
class AnalysisRasterOutputAdmin(admin.ModelAdmin):
    """Admin for AnalysisRasterOutput model."""

    list_display = (
        'uuid', 'name', 'status', 'size',
        'generate_start_time', 'generate_end_time',
        'download_link'
    )
    actions = [generate_raster_output]

    def download_link(self, obj: AnalysisRasterOutput):
        if obj.status != 'COMPLETED':
            return '-'
        return format_html(
            '<a href="{}">Download</a>',
            reverse('admin:analysis_results_download_file',
                    args=[obj.pk])
        )
    download_link.short_description = 'Download File'

    def get_urls(self):
        urls = super(AnalysisRasterOutputAdmin, self).get_urls()
        urls += [
            re_path(
                r'^download-file/(?P<pk>[\da-f-]+)$',
                self.download_file,
                name='analysis_results_download_file'
            ),
        ]
        return urls

    def download_file(self, request, pk):
        result = AnalysisRasterOutput.objects.get(uuid=pk)
        if result.status != 'COMPLETED':
            raise Http404('File is not generated')

        file = get_gdrive_file(result.raster_filename)
        if not file:
            raise Http404("File not found in Google Drive")
        else:
            # Download and stream the file
            def file_iterator():
                file.FetchContent()
                # Read in 8MB chunks
                while chunk := file.content.read(8 * 1024 * 1024):
                    yield chunk

            response = StreamingHttpResponse(
                file_iterator(),
                content_type='image/tiff'
            )
            response['Content-Disposition'] = (
                f'attachment; filename="{result.name}"'
            )
            return response


@admin.register(AnalysisTask)
class AnalysisTaskAdmin(admin.ModelAdmin):
    """Admin for AnalysisTask model."""

    list_display = ('submitted_by', 'status', 'completed_at',)
    list_filter = ('status',)


@admin.register(Indicator)
class IndicatorAdmin(admin.ModelAdmin):
    """Admin for Indicator model."""

    list_display = (
        'name', 'source', 'get_analysis_type',
        'get_temporal_resolutions', 'is_active',
    )
    search_fields = ('name',)

    def get_analysis_type(self, obj: Indicator):
        """Return a comma-separated string of analysis types."""
        return ', '.join(obj.analysis_types) if obj.analysis_types else '-'
    get_analysis_type.short_description = 'Analysis Types'

    def get_temporal_resolutions(self, obj: Indicator):
        """Return a comma-separated string of temporal resolutions."""
        return (
            ', '.join(obj.temporal_resolutions) if
            obj.temporal_resolutions else '-'
        )
    get_temporal_resolutions.short_description = 'Temporal Resolutions'


@admin.register(UserIndicator)
class UserIndicatorAdmin(IndicatorAdmin):
    list_display = (
        'name', 'created_by', 'source', 'get_analysis_type',
        'get_temporal_resolutions', 'is_active',
    )


@admin.register(UserGEEAsset)
class UserGEEAssetAdmin(GEEAssetAdmin):
    list_display = ('key', 'created_by', 'type', 'source',)
