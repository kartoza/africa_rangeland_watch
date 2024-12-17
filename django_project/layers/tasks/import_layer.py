# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background tasks
"""

import os
import requests
import mimetypes
from datetime import datetime
from django.urls import reverse
from django.conf import settings
from celery.utils.log import get_task_logger
from cloud_native_gis.models import Layer, LayerUpload, UploadStatus

from core.celery import app
from core.models import Preferences
from layers.models import InputLayer, InputLayerType


logger = get_task_logger(__name__)


def get_link_from_gdrive(file_url):
    """Get downloadable link from gdrive."""
    file_id = file_url.split('/d/')[1].split('/')[0]
    # this is only for large file that skip the virus scans
    return (
        "https://drive.usercontent.google.com/download?"
        f"export=download&id={file_id}&confirm=1"
    )


def download_file_from_url(
    file_url, download_dir, progress_callback=None, auth_header=None
):
    """Download file from url to download_dir."""
    try:
        if 'drive.google' in file_url:
            file_url = get_link_from_gdrive(file_url)

        headers = None
        if auth_header:
            headers = {
                'Authorization': auth_header
            }

        response = requests.get(file_url, stream=True, headers=headers)

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
            total_size = int(response.headers.get('Content-Length', 0))
            downloaded_size = 0
            last_update = datetime.now()

            with open(full_path, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
                    downloaded_size += len(chunk)

                    # Report progress if callback is provided
                    if (
                        progress_callback and total_size > 0 and
                        (
                            last_update is None or
                            (datetime.now() - last_update).total_seconds() >
                            0.5
                        )
                    ):
                        progress_percentage = (
                            downloaded_size / total_size
                        ) * 100
                        progress_callback(progress_percentage)
                        last_update = datetime.now()

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


def update_layer_upload_progress(
        layer_upload: LayerUpload, progress):
    """Update layer upload progress."""
    layer_upload.update_status(
        status=UploadStatus.RUNNING,
        progress=int(progress),
        note='Downloading file'
    )


@app.task
def import_layer(layer_id, upload_id, file_url):
    """Import data from url."""
    try:
        layer = Layer.objects.get(unique_id=layer_id)
        input_layer = InputLayer.objects.get(uuid=layer_id)
        layer_upload = LayerUpload.objects.get(id=upload_id)

        # load preferences
        preferences = Preferences.load()
        base_url = settings.DJANGO_BACKEND_URL
        if base_url.endswith('/'):
            base_url = base_url[:-1]

        # Download file
        auth = None
        if file_url is None:
            file_url = (
                base_url + reverse('frontend-api:pmtile-layer', kwargs={
                    'upload_id': upload_id,
                })
            )
            auth = f'Token {preferences.worker_layer_api_key}'

        filename = download_file_from_url(
            file_url,
            layer_upload.folder,
            progress_callback=(
                lambda progress: update_layer_upload_progress(
                    layer_upload, progress)
            ),
            auth_header=auth
        )
        if filename:
            input_layer.name = filename
            input_layer.layer_type = detect_file_type_by_extension(
                filename
            )
            input_layer.save()
            # reset the status of layer_upload
            layer_upload.update_status(
                status=UploadStatus.START,
                progress=0,
                note='Processing file'
            )
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

        # upload pmtiles to Django
        if layer.pmtile:
            auth = f'Token {preferences.worker_layer_api_key}'
            upload_path = (
                base_url + reverse('frontend-api:pmtile-layer', kwargs={
                    'upload_id': upload_id,
                })
            )
            is_success = upload_file(
                upload_path,
                os.path.join(settings.MEDIA_ROOT, layer.pmtile.name),
                auth_header=auth
            )
            if not is_success:
                logger.warning(
                    f'PMTile upload for layer {layer_id} failed!')
                layer.is_ready = False
                layer.pmtile.delete(save=True)

                # fallback to use vector tile
                input_layer.url = base_url + layer.tile_url
                input_layer.save()
            layer_upload.emptying_folder()
        else:
            logger.warning(
                f'PMTile generation for layer {layer_id} is failed!')
            # fallback to use vector tile
            input_layer.url = base_url + layer.tile_url
            input_layer.save()
    except Layer.DoesNotExist:
        logger.error(f'Layer {layer_id} does not exist')
    except InputLayer.DoesNotExist:
        logger.error(f'InputLayer {layer_id} does not exist')
