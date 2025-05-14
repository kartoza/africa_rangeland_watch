# -*- coding: utf-8 -*-

from datetime import timedelta
from django.utils import timezone
from core.celery import app
from layers.models import ExportedCog
from analysis.utils import delete_gdrive_file
import logging

logger = logging.getLogger(__name__)


@app.task(name="cleanup_exported_cogs_from_drive")
def cleanup_exported_cogs_from_drive():
    """
    Weekly task to delete GDrive COG files older than 7 days.
    """
    threshold_date = timezone.now() - timedelta(days=7)
    old_cogs = ExportedCog.objects.filter(
        downloaded=True,
        updated_at__lt=threshold_date
    )

    for cog in old_cogs:
        try:
            if cog.gdrive_file_id:
                delete_gdrive_file(cog.file_name)
                logger.info(f"Deleted COG from Drive: {cog.file_name}")
                cog.downloaded = False
                cog.gdrive_file_id = None
                cog.save()
        except Exception as ex:
            logger.error(f"Failed to delete {cog.file_name} from Drive: {ex}")
