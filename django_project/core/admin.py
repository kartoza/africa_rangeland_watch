# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Admin Preferences

"""
from django.contrib import admin

from core.models import Preferences
from core.models import UserSession


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'last_page', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('user__username', 'last_page')
    readonly_fields = ('last_updated',)


@admin.register(Preferences)
class PreferencesAdmin(admin.ModelAdmin):
    """Preferences Admin."""

    fieldsets = (
        ('Map', {
            'fields': (
                'map_initial_bound',
            )
        }),
        ('Worker', {
            'fields': (
                'worker_layer_api_key',
            )
        }),
    )

    def has_add_permission(self, request, obj=None):
        """Disable add preferences from admin page."""
        return False
