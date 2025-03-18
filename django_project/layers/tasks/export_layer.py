# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background tasks to export layer
"""

import os
import tempfile
import zipfile
import uuid
from core.celery import app
from celery.utils.log import get_task_logger
from django.urls import reverse
from django.core.files.base import File
from django.conf import settings
from django.utils import timezone

from cloud_native_gis.models.layer import Layer
from core.models import TaskStatus, Preferences
from layers.models import ExportLayerRequest
from layers.utils import upload_file


logger = get_task_logger(__name__)


@app.task
def process_export_request(export_id):
    """Process export layer request from user."""
    export_request = ExportLayerRequest.objects.get(id=export_id)
    try:
        export_request.status = TaskStatus.RUNNING
        export_request.start_datetime = timezone.now()
        export_request.save()

        exported_files = []
        with tempfile.TemporaryDirectory() as working_dir:
            for input_layer in export_request.layers.all():
                # find layer in cloud native gis
                layer = Layer.objects.filter(
                    unique_id=input_layer.uuid
                ).first()
                if layer is None:
                    continue

                logger.info(f'Exporting layer {layer.unique_id}')
                file_path, msg = layer.export_layer(
                    export_request.format,
                    working_dir,
                    filename=input_layer.name
                )

                if file_path is None:
                    logger.error(msg)
                    continue

                exported_files.append(file_path)

            if len(exported_files) == 0:
                raise RuntimeError('No generated file!')

            # if there are more than 1 file, zip the files
            output_file = None
            if len(exported_files) > 1:
                zip_filepath = os.path.join(
                    working_dir,
                    f'{uuid.uuid4().hex}.zip'
                )
                with zipfile.ZipFile(
                    zip_filepath, 'w', zipfile.ZIP_DEFLATED
                ) as archive:
                    for exported_file in exported_files:
                        archive.write(
                            exported_file,
                            arcname=os.path.basename(exported_file)
                        )
                output_file = zip_filepath
            else:
                output_file = exported_files[0]

            # store to media directory
            if settings.DEBUG:
                with open(output_file, 'rb') as f:
                    export_request.file.save(
                        os.path.basename(output_file),
                        File(f),
                        save=True
                    )
            else:
                # load preferences
                preferences = Preferences.load()
                base_url = settings.DJANGO_BACKEND_URL
                if base_url.endswith('/'):
                    base_url = base_url[:-1]
                auth = f'Token {preferences.worker_layer_api_key}'

                # upload to API
                upload_path = (
                    base_url +
                    reverse('frontend-api:upload-exported-file', kwargs={
                        'request_id': export_id,
                    })
                )
                is_success = upload_file(
                    upload_path,
                    output_file,
                    auth_header=auth
                )
                if not is_success:
                    raise RuntimeError(
                        f'Upload exported file for {export_id} failed!'
                    )
                # reload to refresh the updated file field
                export_request.refresh_from_db()

            export_request.end_datetime = timezone.now()
            export_request.status = TaskStatus.COMPLETED
            if len(exported_files) != export_request.layers.count():
                export_request.notes = (
                    'There are '
                    f'{export_request.layers.count() - len(exported_files)} '
                    'layers that are failed to be exported!'
                )
    except Exception as ex:
        logger.error(f'Failed to export layers {ex}')
        export_request.status = TaskStatus.FAILED
        export_request.notes = str(ex)
    finally:
        export_request.save()


@app.task
def cleanup_export_request():
    """Remove export request older than a day."""
    ExportLayerRequest.objects.filter(
        created_at__lt=timezone.now() - timezone.timedelta(days=1)
    ).delete()
