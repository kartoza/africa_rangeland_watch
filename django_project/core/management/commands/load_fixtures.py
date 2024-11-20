# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Load fixtures
"""

import logging
import os

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from core.settings.utils import DJANGO_ROOT

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Command to load fixtures."""

    help = 'Load all fixtures'

    def handle(self, *args, **options):
        """Handle load fixtures."""
        for app in settings.PROJECT_APPS:
            folder = os.path.join(
                DJANGO_ROOT, app, 'fixtures'
            )
            if os.path.exists(folder):
                for subdir, dirs, files in os.walk(folder):
                    files.sort()
                    for file in files:
                        if file.endswith('.json'):
                            logger.info(f"Loading {file}")
                            print(f"Loading {app}/{file}")
                            call_command('loaddata', file)
