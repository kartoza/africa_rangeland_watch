from django.core.management.base import BaseCommand
import json
import logging
import os
import shutil
import tempfile
import time
import typing
import uuid

import requests
from core.celery import app
from django.utils import timezone
from django.conf import settings

from layers.models import (
    InputLayer as InputLayerFixture,
    DataProvider,
    InputLayerType,
    LayerGroupType,
)
from cloud_native_gis.models.layer import Layer, LayerType
from cloud_native_gis.models.layer_upload import LayerUpload

from trendsearth.models import (
    TrendsEarthJob,
    TrendsEarthJobStatus,
    TrendsEarthJobType,
    TrendsEarthSetting,
)
from trendsearth.api import (
    TrendsEarthAuthError,
    TrendsEarthAPIError,
    refresh_access_token,
    get_execution_status,
    extract_result_bands,
    submit_ldn_job,
    submit_drought_job,
    submit_urbanization_job,
    submit_population_job,
)


class Command(BaseCommand):
    help = "Run something"

    def handle(self, *args, **options):
        job = TrendsEarthJob.objects.get(id=1)

        try:
            te_setting = TrendsEarthSetting.objects.get(user=job.user)
        except TrendsEarthSetting.DoesNotExist:
            job.status = TrendsEarthJobStatus.FAILED
            job.error = {'message': 'Trends.Earth credentials not found'}
            job.save(update_fields=['status', 'error', 'updated_at'])
            return

        try:
            access_token, new_refresh = refresh_access_token(
                te_setting.refresh_token
            )
            print(new_refresh)
            if new_refresh != te_setting.refresh_token:
                te_setting.refresh_token = new_refresh
                te_setting.save(update_fields=['refresh_token', 'updated_at'])
        except TrendsEarthAuthError as exc:
            job.status = TrendsEarthJobStatus.FAILED
            job.error = {'message': f'Authentication failed: {exc}'}
            job.save(update_fields=['status', 'error', 'updated_at'])
            print(exc)