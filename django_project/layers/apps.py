from django.apps import AppConfig
from django.db.models.signals import post_save


class LayersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'layers'

    def ready(self):
        """Disable LayerUpload post_save signal."""
        from cloud_native_gis.models.layer_upload import (
            LayerUpload,
            run_layer_upload
        )
        post_save.disconnect(
            run_layer_upload,
            sender=LayerUpload
        )
