"""Admin configuration for the frontend application."""
from django.contrib import admin

from frontend.models import BaseMap, AssetUploadItem


@admin.register(BaseMap)
class BaseMapAdmin(admin.ModelAdmin):
    """Admin for BaseMap model."""

    list_display = ('name', 'url',)


@admin.register(AssetUploadItem)
class AssetUploadItemAdmin(admin.ModelAdmin):
    """Admin for AssetUploadItem model."""

    list_display = ('id', 'file_name', 'file_size', 'session', 'uploaded_by',)
    readonly_fields = (
        'upload_date', 'uploaded_by', 'session', 'upload_path', 'file_size',
    )
