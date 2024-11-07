from django.contrib import admin
from .models import Dashboard


@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'privacy_type', 'created_at', 'updated_at')
    list_filter = ('privacy_type', 'created_at', 'updated_at')
    search_fields = ('uuid',)
    filter_horizontal = ('organisations', 'groups', 'users')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('privacy_type',)
        }),
        ('Associations', {
            'fields': ('organisations', 'groups', 'users')
        }),
        ('Configuration', {
            'fields': ('config',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
