from django.apps import AppConfig
from django.db.models.signals import post_save


class LayersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'layers'

    def ready(self):
        """Disable LayerUpload post_save signal."""
        from layers.tasks.generate_layer import generate_baseline_nrt_layers  # noqa
        from layers.tasks.export_layer import cleanup_export_request  # noqa
        import layers.tasks.export_nrt_cog # noqa
        from cloud_native_gis.models.layer_upload import (
            LayerUpload,
            run_layer_upload
        )
        post_save.disconnect(
            run_layer_upload,
            sender=LayerUpload
        )
