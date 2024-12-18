# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Views for Preferences

"""
from django.views.generic.base import RedirectView

from core.models import Preferences


class PreferencesRedirectView(RedirectView):
    """Redirect to preferences admin page."""

    permanent = False

    def get_redirect_url(self, *args, **kwargs):
        """Return absolute URL to redirect to."""
        Preferences.load()
        return '/admin/core/preferences/1/change/'
