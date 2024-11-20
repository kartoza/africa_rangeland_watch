# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Admin Preferences

"""
from django.contrib import admin

from core.models import Preferences


@admin.register(Preferences)
class PreferencesAdmin(admin.ModelAdmin):
    """Preferences Admin."""

    fieldsets = (
        ('Map', {
            'fields': (
                'map_initial_bound',
            )
        }),
    )

    def has_add_permission(self, request, obj=None):
        """Disable add preferences from admin page."""
        return False
