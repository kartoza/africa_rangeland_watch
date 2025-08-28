# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for GCS.
"""

import os
import json
import base64
import uuid
import tempfile
from datetime import datetime
from google.cloud import storage
from django.conf import settings
from contextlib import contextmanager
import rasterio
from rasterio.env import Env


def get_gcs_client():
    """Get google cloud storage client."""
    key_data = os.getenv("SERVICE_ACCOUNT_KEY")
    key_data = base64.b64decode(key_data).decode('utf-8')
    client = storage.Client.from_service_account_info(
        json.loads(key_data)
    )
    bucket_name = settings.GCS_BUCKET_NAME

    return client.bucket(bucket_name)


def generate_object_name(user_id: str, original_filename: str) -> str:
    """Generate a unique object name for GCS"""
    # Create a unique filename to prevent conflicts
    unique_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d")

    # Structure: uploads/{user_id}/{date}/{uuid}-{original_name}
    return (
        f"uploads/{user_id}/{timestamp}/{unique_id}-"
        f"{original_filename}"
    )


@contextmanager
def rasterio_read_gcs(file_path: str):
    """Context manager to set up rasterio environment for GCS access."""
    key_data = os.getenv("SERVICE_ACCOUNT_KEY")
    key_data = base64.b64decode(key_data).decode('utf-8')

    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as temp_key_file:
        temp_key_file.write(key_data.encode('utf-8'))
        temp_key_file_path = temp_key_file.name

    # Configure GDAL environment for GCS
    gdal_config = {
        'GDAL_DISABLE_READDIR_ON_OPEN': 'EMPTY_DIR',
        'CPL_VSIL_CURL_ALLOWED_EXTENSIONS': '.tif,.tiff',
        'GDAL_HTTP_TIMEOUT': 30,
        'GDAL_HTTP_CONNECTTIMEOUT': 30,
        'CPL_VSIL_CURL_USE_HEAD': 'NO',
        'GDAL_CACHEMAX': 1000
    }

    try:
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_key_file_path
        
        with Env(**gdal_config):
            gcs_path = f'gs://{settings.GCS_BUCKET_NAME}/{file_path}'
            with rasterio.open(gcs_path) as dataset:
                yield dataset
    finally:
        os.remove(temp_key_file_path)
        os.environ.pop('GOOGLE_APPLICATION_CREDENTIALS', None)
