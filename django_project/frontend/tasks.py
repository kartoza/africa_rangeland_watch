# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background tasks
"""

import os
import requests
import mimetypes
from django.urls import reverse
from django.conf import settings
from celery.utils.log import get_task_logger
from cloud_native_gis.models import Layer, LayerUpload, UploadStatus

from core.celery import app
from layers.models import InputLayer, InputLayerType


logger = get_task_logger(__name__)


def get_link_from_gdrive(file_url):
    """Get downloadable link from gdrive."""
    file_id = file_url.split('/d/')[1].split('/')[0]
    return f"https://drive.google.com/uc?export=download&id={file_id}"


def download_file_from_url(file_url, download_dir):
    """Download file from url to download_dir."""
    try:
        if 'drive.google' in file_url:
            file_url = get_link_from_gdrive(file_url)

        response = requests.get(file_url, stream=True)

        # Check if the request was successful
        if response.status_code == 200:
            # extract filename from header
            content_disposition = response.headers.get('Content-Disposition')
            if content_disposition and 'filename=' in content_disposition:
                local_filename = content_disposition.split(
                    "filename="
                )[-1].strip('"')
            else:
                # Default filename if none provided in the header
                local_filename = "downloaded_file"

                # Get the Content-Type header and infer file extension
                content_type = response.headers.get('Content-Type')
                if content_type:
                    # Use mimetypes to guess the file extension
                    extension = mimetypes.guess_extension(content_type)
                    if extension and not local_filename.endswith(extension):
                        local_filename += extension

            # Write the content to a local file
            full_path = os.path.join(download_dir, local_filename)
            with open(full_path, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):  # Download in chunks
                    file.write(chunk)

            return local_filename
        else:
            logger.error(
                "Failed to download file. "
                f"HTTP Status Code: {response.status_code}"
            )
            logger.error("Response:", response.text)
            return None
    except Exception as e:
        logger.error(f"An error occurred while download file: {e}")
        return None


def detect_file_type_by_extension(file_path):
    """Detect file type by extension."""
    raster_extensions = ['.tif', '.tiff', '.img', '.nc']
    vector_extensions = ['.shp', '.geojson', '.gpkg', '.kml', '.zip']

    ext = os.path.splitext(file_path)[-1].lower()
    if ext in raster_extensions:
        return InputLayerType.RASTER
    elif ext in vector_extensions:
        return InputLayerType.VECTOR
    return "Unknown"


@app.task
def import_layer(layer_id, file_url):
    """Import data from url."""
    try:
        layer = Layer.objects.get(unique_id=layer_id)
        input_layer = InputLayer.objects.get(uuid=layer_id)
        layer_upload = LayerUpload.objects.filter(
            layer=layer
        ).last()

        if layer_upload is None:
            layer_upload = LayerUpload(
                created_by=layer.created_by, layer=layer
            )
            layer_upload.emptying_folder()
            layer_upload.save()

        # Download file
        if file_url:
            filename = download_file_from_url(file_url, layer_upload.folder)
            if filename:
                input_layer.name = filename
                input_layer.layer_type = detect_file_type_by_extension(
                    filename
                )
                input_layer.save()
            else:
                layer_upload.update_status(
                    status=UploadStatus.FAILED,
                    note='Failed to download the file!'
                )
                return
        
        # trigger task
        layer_upload.import_data()

        # check if tiles ready
        layer.refresh_from_db()
        if not layer.is_ready:
            return

        # update url in InputLayer
        base_url = settings.DJANGO_BACKEND_URL
        if base_url.endswith('/'):
            base_url = base_url[:-1]
        if layer.pmtile:
            input_layer.url = (
                f'pmtiles://{base_url}'
                + reverse('serve-pmtiles', kwargs={
                    'layer_uuid': layer.unique_id,
                })
            )
        else:
            input_layer.url = base_url + layer.tile_url
        
        input_layer.save()
    except Layer.DoesNotExist as ex:
        logger.error(f'Layer {layer_id} does not exist')
    except InputLayer.DoesNotExist as ex:
        logger.error(f'InputLayer {layer_id} does not exist')
