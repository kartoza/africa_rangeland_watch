# coding=utf-8
"""
ARW: Task to export Earth Engine image to Google Drive as COG and download it.
"""

import time
import os
from django.conf import settings
from celery import shared_task
from cloud_native_gis.models.layer import Layer
from layers.models import InputLayer
from analysis.analysis import export_image_to_drive
from analysis.utils import get_gdrive_file, delete_gdrive_file
from layers.utils import get_nrt_image


@shared_task(name="export_ee_image_to_cog")
def export_ee_image_to_cog(
    input_layer_id,
    landscape_id,
    export_folder="ARW-NRT-Exports"
):
    """
    Export EE image associated with InputLayer
    to GDrive as COG and download it."""
    try:
        # Load InputLayer
        input_layer = InputLayer.objects.get(uuid=input_layer_id)

        ee_image, region = get_nrt_image(input_layer, landscape_id)
        file_name = (
            f"{input_layer.name.replace(' ', '_')}_{input_layer_id}.tif"
        )

        task_config = {
            "image": ee_image,
            "description": file_name,
            "folder": export_folder,
            "fileNamePrefix": file_name.replace(".tif", ""),
            "scale": 30,
            "region": region,
            "vis_params": input_layer.get_vis_params() if hasattr(
                input_layer, 'get_vis_params') else None
        }

        # Start EE export task
        task = export_image_to_drive(**task_config)
        task.start()
        print(f"[INFO] Started EE export task: {file_name}")

        # Wait for task to complete (polling every 30 sec, timeout in ~30 min)
        start = time.time()
        while task.status()["state"] in ["READY", "RUNNING"]:
            if time.time() - start > 1800:
                raise TimeoutError("Export timed out after 30 minutes.")
            time.sleep(30)
            print(f"[INFO] Exporting {file_name}: {task.status()['state']}...")

        if task.status()["state"] != "COMPLETED":
            raise RuntimeError(f"Export failed: {task.status()}")

        print(f"[INFO] Export complete. Looking for {file_name} on Drive...")

        # Poll GDrive for exported file
        for _ in range(20):
            gfile = get_gdrive_file(file_name)
            if gfile:
                break
            time.sleep(10)
        else:
            raise FileNotFoundError(f"File {file_name} not found on Drive.")

        # Save to local /media/cloud_native_gis_files/
        media_dir = os.path.join(settings.MEDIA_ROOT, "cloud_native_gis_files")
        os.makedirs(media_dir, exist_ok=True)

        destination_path = os.path.join(media_dir, file_name)
        gfile.GetContentFile(destination_path)

        # Update InputLayer with media URL
        input_layer.url = f"/media/cloud_native_gis_files/{file_name}"
        input_layer.metadata["cog_downloaded"] = True
        input_layer.save()

        # Save to cloud_native_gis Layer object
        layer = Layer.objects.filter(unique_id=input_layer_id).first()
        if layer:
            layer.refresh_from_db()
            layer.update_status(progress=100, note="COG download complete")

        # Clean up GDrive
        delete_gdrive_file(file_name)
        print(f"[INFO] Cleaned up file {file_name} from GDrive.")

    except Exception as ex:
        print(f"[ERROR] Failed to export/download COG: {ex}")
        if input_layer:
            input_layer.metadata["cog_error"] = str(ex)
            input_layer.save()
