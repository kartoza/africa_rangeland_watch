from django.apps import AppConfig


class LayersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'layers'

    def ready(self):
        """App ready handler."""
        from layers.tasks import generate_baseline_nrt_layers  # noqa
