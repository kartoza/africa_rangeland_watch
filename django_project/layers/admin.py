from django.contrib import admin
from .models import (
    DataProvider,
    InputLayer,
    DataFeedSetting,
    LayerGroupType,
    ExportLayerRequest,
    ExternalLayer,
    ExternalLayerSource,
    FetchHistory,
)
from .forms import ExternalLayerUploadForm
from .utils import ingest_external_layer


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


@admin.register(ExternalLayerSource)
class ExternalLayerSourceAdmin(admin.ModelAdmin):
    list_display = (
        "name", "provider", "fetch_type", "frequency",
        "active", "url", "updated_at"
    )
    list_filter = ("provider", "fetch_type", "frequency", "active")
    search_fields = ("name", "provider__name", "url")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ExternalLayer)
class ExternalLayerAdmin(admin.ModelAdmin):
    form = ExternalLayerUploadForm
    list_display = (
        "name",
        "source",
        "layer_type",
        "is_public",
        "is_auto_published",
        "created_at",
    )
    list_filter = ("source", "layer_type", "is_public", "is_auto_published")
    search_fields = ("name", "source__name")
    readonly_fields = ("created_at", "updated_at")

    def save_model(self, request, obj, form, change):
        if not change:
            uploaded_file = form.cleaned_data["file"]
            source = form.cleaned_data["source"]

            layer = ingest_external_layer(
                source, uploaded_file, created_by=request.user
            )

            layer.name = form.cleaned_data["name"]
            layer.is_public = form.cleaned_data["is_public"]
            layer.is_auto_published = form.cleaned_data["is_auto_published"]
            layer.save()

        else:
            super().save_model(request, obj, form, change)


@admin.register(FetchHistory)
class FetchHistoryAdmin(admin.ModelAdmin):
    """Admin for FetchHistory model."""
    list_display = ("source", "status", "created_at")
    list_filter = ("status", "source")
    search_fields = ("source__name", "message")
    readonly_fields = ("source", "status", "message", "created_at")
