# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Common class for unit tests.
"""

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from core.factories import UserF


class BaseAPIViewTest(TestCase):
    """Base class for API test."""

    def setUp(self):
        """Init test class."""
        self.factory = APIRequestFactory()

        # add superuser
        self.superuser = UserF.create(
            is_staff=True,
            is_superuser=True,
            is_active=True
        )

        # add normal user
        self.user = UserF.create(
            is_active=True
        )

    def _assert_keys_in_dict(self, item: dict, keys: list):
        """Assert that all keys are in the item dict."""
        for key in keys:
            self.assertIn(key, item)
