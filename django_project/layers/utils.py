# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for layers
"""

import requests
import os
import rasterio
from datetime import datetime
from django.core.files.base import ContentFile
from layers.models import ExternalLayer


def upload_file(url, file_path, field_name="file", auth_header=None):
    """
    Upload a file to the given URL.

    :param url: The URL to send the POST request to.
    :param file_path: The path to the file to be uploaded.
    :param field_name: The form field name for the file (default: 'file').
    :return: The response from the server.
    """
    headers = None
    if auth_header:
        headers = {
            'Authorization': auth_header
        }
    # Open the file in binary mode
    with open(file_path, 'rb') as f:
        # Pass the file as a file-like object to the `files` parameter
        files = {field_name: (file_path, f)}

        # Send the POST request with the file
        response = requests.post(url, files=files, headers=headers)

    return response.status_code == 200


def extract_raster_metadata(file_path):
    """
    Extracts bounds, resolution, CRS,
    band info, min/max values from a GeoTIFF.
    """
    with rasterio.open(file_path) as src:
        bounds = src.bounds
        crs = src.crs.to_string()
        resolution = src.res
        band_count = src.count
        array = src.read(1)
        return {
            "bounds": [bounds.left, bounds.bottom, bounds.right, bounds.top],
            "crs": crs,
            "resolution": resolution,
            "band_count": band_count,
            "min": float(array.min()),
            "max": float(array.max()),
        }


def ingest_external_layer(source, uploaded_file, created_by=None):
    """
    Ingests a raster file and creates an ExternalLayer
    linked to the given source.

    - `source`: ExternalLayerSource instance
    - `uploaded_file`: InMemoryUploadedFile (from admin or DRF upload)
    - `created_by`: User instance
    """
    filename = uploaded_file.name
    temp_path = f"/tmp/{datetime.now().timestamp()}_{filename}"

    # Save temporarily for metadata extraction
    with open(temp_path, "wb") as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)

    metadata = extract_raster_metadata(temp_path)

    # Save to ExternalLayer
    layer = ExternalLayer(
        name=filename,
        source=source,
        layer_type="raster",
        metadata=metadata,
        created_by=created_by,
        is_public=True,
        is_auto_published=source.fetch_type != "manual",
    )

    with open(temp_path, "rb") as final_file:
        layer.file.save(filename, ContentFile(final_file.read()))

    layer.save()
    os.remove(temp_path)

    return layer
