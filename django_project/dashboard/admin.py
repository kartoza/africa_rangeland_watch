from django.contrib import admin
from .models import Dashboard, DashboardWidget
from dashboard.tasks import generate_dashboard_thumbnails


def generate_thumbnail(modeladmin, request, queryset):
    """Generate thumbnails for selected dashboards."""
    dashboard_ids = queryset.values_list('uuid', flat=True)
    generate_dashboard_thumbnails.delay(list(dashboard_ids))


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = (
        'uuid',
        'title',
        'privacy_type',
        'created_at',
        'updated_at',
        'linked_analysis_results'
    )
    list_filter = ('privacy_type', 'created_at', 'updated_at')
    search_fields = ('uuid', 'title')
    filter_horizontal = (
        'organisations',
        'groups',
        'users',
        'analysis_results'
    )
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('privacy_type', 'title', 'thumbnail')
        }),
        ('Associations', {
            'fields': (
                'organisations',
                'groups',
                'users',
                'analysis_results'
            )
        }),
        ('Configuration', {
            'fields': ('config',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    actions = [generate_thumbnail]

    def linked_analysis_results(self, obj):
        """
        Display the associated UserAnalysisResults in a human-readable format.
        """
        results = obj.analysis_results.all()
        return (
            ', '.join([str(result) for result in results])
            if results else "None"
        )

    linked_analysis_results.short_description = "Linked Analysis Results"


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    """Admin for DashboardWidget model."""
    list_display = (
        'id',
        'dashboard',
        'widget_type',
        'title',
        'order',
        'created_at'
    )
    list_filter = ('widget_type', 'dashboard')
    search_fields = ('dashboard__title', 'title')
