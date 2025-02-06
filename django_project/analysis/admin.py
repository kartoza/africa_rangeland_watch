from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from django.http import StreamingHttpResponse, Http404
from django.urls import re_path, reverse
from django.utils.html import format_html

from .models import (
    Analysis,
    InterventionArea,
    Landscape,
    LandscapeCommunity,
    UserAnalysisResults
)
from analysis.utils import get_gdrive_file, delete_gdrive_file


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

    list_display = ('name', 'project_name')
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


def clear_raster_output(modeladmin, request, queryset):
    """Clear raster output from analysis results."""
    for result in queryset:
        if not result.raster_output_path:
            continue

        if delete_gdrive_file(result.raster_output_path):
            result.raster_output_path = None
            result.save()


class UserAnalysisResultsAdmin(admin.ModelAdmin):
    list_display = ('created_by', 'source', 'created_at', 'download_link')
    search_fields = ('created_by__username', 'source',)
    list_filter = ('source',)
    actions = [clear_raster_output]

    def download_link(self, obj: UserAnalysisResults):
        if not obj.raster_output_path:
            return '-'
        return format_html(
            '<a href="{}">Download</a>',
            reverse('admin:analysis_results_download_file',
                    args=[obj.pk])
        )
    download_link.short_description = 'Download File'

    def get_urls(self):
        urls = super(UserAnalysisResultsAdmin, self).get_urls()
        urls += [
            re_path(r'^download-file/(?P<pk>\d+)$', self.download_file,
                    name='analysis_results_download_file'),
        ]
        return urls

    def view_analysis_results(self, obj):
        return str(obj.analysis_results)[:100]
    view_analysis_results.short_description = 'Analysis Results...'

    def download_file(self, request, pk):
        result = UserAnalysisResults.objects.get(id=pk)
        if not result.raster_output_path:
            raise Http404('File not found')

        file = get_gdrive_file(result.raster_output_path)
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
                f'attachment; filename="{result.raster_output_path}"'
            )
            return response


admin.site.register(UserAnalysisResults, UserAnalysisResultsAdmin)
