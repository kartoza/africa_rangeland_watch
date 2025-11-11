# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Auth APIs
"""

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from allauth.socialaccount.models import SocialApp


class AvailableSocialAuthProvidersAPI(APIView):
    """API to return list of available social auth providers."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        """Fetch list of available social auth providers."""
        providers = SocialApp.objects.all().values_list('provider', flat=True)
        return Response(
            status=200,
            data=list(providers)
        )
