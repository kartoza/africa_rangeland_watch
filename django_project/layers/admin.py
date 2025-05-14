from django.contrib import admin
from .models import (
    DataProvider,
    InputLayer,
    DataFeedSetting,
    LayerGroupType,
    ExportLayerRequest,
    ExportedCog
)


@admin.register(DataProvider)
class DataProviderAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('name',)
        }),
        ('Contact Information', {
            'fields': ('file', 'url')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(InputLayer)
class InputLayerAdmin(admin.ModelAdmin):
    list_display = (
        'name', 'layer_type', 'data_provider', 'created_at', 'updated_at')
    list_filter = ('layer_type', 'data_provider', 'created_at', 'updated_at')
    search_fields = ('name', 'data_provider__name')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['data_provider', 'created_by', 'updated_by']

    fieldsets = (
        (None, {
            'fields': ('name', 'layer_type', 'data_provider')
        }),
        ('User Information', {
            'fields': ('created_by', 'updated_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
        ('Metadata', {
            'fields': ('url', 'group', 'metadata')
        }),
    )


@admin.register(DataFeedSetting)
class DataFeedSettingAdmin(admin.ModelAdmin):
    list_display = (
        'provider', 'frequency', 'enable_alert', 'last_sync_timestamp')
    list_filter = ('frequency', 'enable_alert', 'email_alert', 'in_app_alert')
    search_fields = ('provider__name',)
    readonly_fields = (
        'created_at', 'updated_at', 'last_sync_timestamp', 'last_sync_status')
    autocomplete_fields = ['provider']

    fieldsets = (
        (None, {
            'fields': ('provider', 'frequency')
        }),
        ('Alert Settings', {
            'fields': ('enable_alert', 'email_alert', 'in_app_alert')
        }),
        ('Sync Information', {
            'fields': ('last_sync_timestamp', 'last_sync_status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(LayerGroupType)
class LayerGroupTypeAdmin(admin.ModelAdmin):
    """Admin for LayerGroupType model."""

    list_display = ('name',)


@admin.register(ExportLayerRequest)
class ExportLayerRequestAdmin(admin.ModelAdmin):
    """Admin for ExportLayerRequest model."""

    list_display = ('created_at', 'requested_by', 'format', 'status')


@admin.register(ExportedCog)
class ExportedCogAdmin(admin.ModelAdmin):
    """Admin for ExportedCog model."""

    list_display = (
        "input_layer", "landscape_id", "file_name", "downloaded", "created_at"
    )
    list_filter = ("downloaded", "created_at")
    search_fields = ("file_name", "input_layer__name")
