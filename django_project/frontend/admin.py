"""Admin configuration for the frontend application."""
from django.contrib import admin

from frontend.models import BaseMap


@admin.register(BaseMap)
class BaseMapAdmin(admin.ModelAdmin):
    """Admin for BaseMap model."""

    list_display = ('name', 'url',)
