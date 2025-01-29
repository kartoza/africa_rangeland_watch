from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin

from .models import (
    Analysis,
    InterventionArea,
    Landscape,
    LandscapeCommunity,
    UserAnalysisResults
)


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


class UserAnalysisResultsAdmin(admin.ModelAdmin):
    list_display = ('created_by', 'source', 'created_at',)
    search_fields = ('created_by__username', 'source',)
    list_filter = ('source',)

    def view_analysis_results(self, obj):
        return str(obj.analysis_results)[:100]
    view_analysis_results.short_description = 'Analysis Results...'


admin.site.register(UserAnalysisResults, UserAnalysisResultsAdmin)
