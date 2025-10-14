# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for BaseMap API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest


class AvailableSocialAuthProvidersAPITest(BaseAPIViewTest):
    """Available social auth providers api test case."""

    def test_get_available_social_auth_providers(self):
        """Test fetching available social auth providers."""
        url = reverse('frontend-api:social-auth-providers')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
