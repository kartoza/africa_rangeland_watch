# coding=utf-8
"""
ARW: Task to export Earth Engine image to Google Drive as COG and download it.
"""

import logging
from celery import shared_task
from django.utils import timezone
from layers.models import InputLayer, ExportedCog
from analysis.analysis import export_image_to_drive, initialize_engine_analysis
from analysis.utils import get_gdrive_file
from layers.utils import get_nrt_image


logger = logging.getLogger(__name__)
CHUNK_SIZE = 5


def export_ee_image_to_cog(
    exported_cog_id,
    export_folder="ARW-NRT-Exports"
):
    """
    Export EE image associated with InputLayer
    to GDrive as COG and download it."""
    exported_cog = None
    initialize_engine_analysis()
    try:
        exported_cog = ExportedCog.objects.get(id=exported_cog_id)
        input_layer = exported_cog.input_layer
        file_name = (
            f"{input_layer.name.replace(' ', '_')}_{input_layer.uuid}.tif"
        )
        exported_cog.status = "PROCESSING"
        exported_cog.started_at = timezone.now()
        exported_cog.save()
        landscape_id = exported_cog.landscape_id

        ee_image, region = get_nrt_image(input_layer, landscape_id)
        task_config = {
            "image": ee_image,
            "description": file_name,
            "folder": export_folder,
            "file_name_prefix": file_name.replace(".tif", ""),
            "scale": 30,
            "region": region,
            "vis_params": input_layer.get_vis_params() if hasattr(
                input_layer, 'get_vis_params') else None
        }

        # Start EE export task
        status = export_image_to_drive(**task_config)
        logger.info(
            f"Export task submitted for {file_name}: {status['state']}"
        )

        if status["state"] != "COMPLETED":
            raise RuntimeError(f"Export failed or incomplete: {status}")

        logger.info(f"Export complete. Looking for {file_name} on Drive...")

        # Poll GDrive for exported file
        gfile = get_gdrive_file(file_name)
        logger.info(
            f"File {file_name} found on GDrive: {gfile.get('id')}"
        )

        # Save to ExportedCog model
        exported_cog.downloaded = True
        exported_cog.file_name = file_name
        exported_cog.gdrive_file_id = gfile.get('id')
        exported_cog.status = 'COMPLETED'
        exported_cog.completed_at = timezone.now()
        exported_cog.save()

        logger.info(
            f"ExportedCog updated: {exported_cog.file_name}, "
            f"ID: {exported_cog.gdrive_file_id}"
        )
        logger.info(
            f"Exported COG for {input_layer.name} successfully stored."
        )

    except Exception as ex:
        logger.error(f"Failed to export COG: {ex}", exc_info=True)
        if exported_cog:
            exported_cog.downloaded = False
            exported_cog.status = 'FAILED'
            exported_cog.errors = str(ex)
            exported_cog.completed_at = timezone.now()
            exported_cog.save()


@shared_task(name="export_ee_image_to_cog_task")
def export_ee_image_to_cog_task(
    exported_cog_id,
    export_folder="ARW-NRT-Exports"
):
    """
    Celery task to export EE image to COG.
    """
    export_ee_image_to_cog(
        exported_cog_id,
        export_folder
    )
