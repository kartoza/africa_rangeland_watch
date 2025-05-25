# coding=utf-8
"""
ARW: Task to export Earth Engine image to Google Drive as COG and download it.
"""

import logging
from celery import shared_task
from core.celery import app
from cloud_native_gis.models.layer import Layer
from layers.models import InputLayer, ExportedCog
from analysis.models import Landscape
from analysis.analysis import export_image_to_drive, initialize_engine_analysis
from analysis.utils import get_gdrive_file
from layers.utils import get_nrt_image


logger = logging.getLogger(__name__)


def export_ee_image_to_cog(
    input_layer_id,
    landscape_id,
    export_folder="ARW-NRT-Exports"
):
    """
    Export EE image associated with InputLayer
    to GDrive as COG and download it."""
    exported_cog = None
    initialize_engine_analysis()
    try:
        # Load InputLayer
        input_layer = InputLayer.objects.get(uuid=input_layer_id)

        ee_image, region = get_nrt_image(input_layer, landscape_id)
        file_name = (
            f"{input_layer.name.replace(' ', '_')}_{input_layer_id}.tif"
        )
        # ExportedCog is a model to track exported COGs
        exported_cog, _ = ExportedCog.objects.get_or_create(
            input_layer=input_layer,
            landscape_id=landscape_id,
            defaults={"file_name": file_name}
        )

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

        # save to InputLayer metadata
        input_layer.metadata["cog_downloaded"] = True
        input_layer.save()
        logger.info(
            f"File {file_name} found on GDrive: {gfile.get('id')}"
        )

        # Save to ExportedCog model
        exported_cog.downloaded = True
        exported_cog.file_name = file_name
        exported_cog.gdrive_file_id = gfile.get('id')
        exported_cog.save()

        logger.info(
            f"ExportedCog updated: {exported_cog.file_name}, "
            f"ID: {exported_cog.gdrive_file_id}"
        )

        layer = Layer.objects.filter(unique_id=input_layer_id).first()
        if layer:
            layer.refresh_from_db()
            layer.update_status(
                progress=100,
                note="COG export stored on GDrive"
            )
        logger.info(
            f"Exported COG for {input_layer.name} successfully stored."
        )

    except Exception as ex:
        logger.error(f"Failed to export COG: {ex}")
        if input_layer:
            input_layer.metadata["cog_error"] = str(ex)
            input_layer.save()
        if exported_cog:
            exported_cog.downloaded = False
            exported_cog.save()


@shared_task(name="export_ee_image_to_cog_task")
def export_ee_image_to_cog_task(
    input_layer_id,
    landscape_id,
    export_folder="ARW-NRT-Exports"
):
    """
    Celery task to export EE image to COG.
    """
    export_ee_image_to_cog(input_layer_id, landscape_id, export_folder)


@app.task(name="export_all_nrt_cogs")
def export_all_nrt_cogs():
    """
    Trigger export for all NRT InputLayers across all landscapes.
    """
    nrt_layers = InputLayer.objects.filter(group__name="near-real-time")

    for landscape in Landscape.objects.all():
        for layer in nrt_layers[:2]:
            export_ee_image_to_cog_task.delay(str(layer.uuid), landscape.id)
