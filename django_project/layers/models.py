import uuid
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_delete
from django.dispatch import receiver
from cloud_native_gis.models.layer import Layer
from cloud_native_gis.utils.fiona import FileType

from core.models import TaskStatus


EXPORTED_FILES_FOLDER = 'exported_files'


class DataProvider(models.Model):
    """
    Model to store information about data providers.
    """

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The name of the data provider."
    )

    file = models.FileField(
        upload_to='data_providers/files/',
        blank=True,
        null=True,
        help_text=(
            "File associated with the data provider, if applicable."
        )
    )

    url = models.URLField(
        blank=True,
        null=True,
        help_text=(
            "URL for the data provider's website or dataset."
        )
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Data Provider"
        verbose_name_plural = "Data Providers"
        ordering = ['name']

    def __str__(self):
        return self.name


class InputLayerType(models.TextChoices):
    """Enum for specifying types of input layers."""

    VECTOR = 'vector', 'Vector'
    RASTER = 'raster', 'Raster'


class LayerGroupType(models.Model):
    """Model to represent layer group type."""

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The name of the group type."
    )

    def __str__(self):
        return self.name


class InputLayer(models.Model):
    """
    Model to represent data layers.
    """

    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the input layer."
    )

    name = models.CharField(
        max_length=255,
        help_text="Name of the input layer."
    )

    layer_type = models.CharField(
        max_length=50,
        choices=InputLayerType.choices,
        default=InputLayerType.VECTOR,
        help_text="Type of the input layer (e.g., vector, raster)."
    )

    data_provider = models.ForeignKey(
        DataProvider,
        on_delete=models.CASCADE,
        related_name="input_layers",
        help_text="The data provider associated with this layer."
    )

    url = models.URLField(
        blank=True,
        null=True,
        help_text="URL for the input layer."
    )

    group = models.ForeignKey(
        LayerGroupType,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        help_text="Layer group type: baseline, near real time, etc."
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="Layer metadata."
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_layers",
        help_text="User who created this input layer."
    )

    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="updated_layers",
        help_text="User who last updated this input layer."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Input Layer"
        verbose_name_plural = "Input Layers"
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_vis_params(self):
        """Convert metadata to GEE vis params."""
        return {
            'min': self.metadata['minValue'],
            'max': self.metadata['maxValue'],
            'palette': self.metadata['colors'],
            'opacity': self.metadata['opacity']
        }


class DataFeedSetting(models.Model):
    """
    Model to store settings for data feeds.
    """

    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the data feed setting."
    )

    provider = models.ForeignKey(
        DataProvider,
        on_delete=models.CASCADE,
        related_name="data_feed_settings",
        help_text=(
            "The data provider associated with this data feed setting."
        )
    )

    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='weekly',
        help_text="Frequency of data feed updates."
    )

    enable_alert = models.BooleanField(
        default=False,
        help_text="Enable or disable alerts for this data feed."
    )

    email_alert = models.BooleanField(
        default=False,
        help_text="Enable email alerts for this data feed."
    )

    in_app_alert = models.BooleanField(
        default=False,
        help_text="Enable in-app alerts for this data feed."
    )

    last_sync_timestamp = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp of the last successful sync."
    )

    last_sync_status = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Status message of the last sync operation."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Data Feed Setting"
        verbose_name_plural = "Data Feed Settings"
        ordering = ['provider', 'frequency']

    def __str__(self):
        return f"{self.provider.name} Feed - {self.frequency}"


@receiver(post_delete, sender=InputLayer)
def input_layer_on_delete(sender, instance: InputLayer, using, **kwargs):
    """Delete layer in cloud_native_gis."""
    layer = Layer.objects.filter(
        unique_id=instance.uuid
    ).first()
    if layer is None:
        return
    layer.delete()


class ExportLayerRequest(models.Model):
    """Model that represent a request to export layer(s)."""

    FORMAT_CHOICES = (
        (FileType.GEOJSON, FileType.GEOJSON),
        (FileType.SHAPEFILE, FileType.SHAPEFILE),
        (FileType.GEOPACKAGE, FileType.GEOPACKAGE),
        (FileType.KML, FileType.KML),
    )

    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        help_text="User who submits the request."
    )
    format = models.CharField(
        max_length=255,
        choices=FORMAT_CHOICES,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    start_datetime = models.DateTimeField(
        blank=True,
        null=True
    )
    end_datetime = models.DateTimeField(
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=50,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING
    )
    # auto cleanup using django_cleanup
    file = models.FileField(
        upload_to=f'{EXPORTED_FILES_FOLDER}/',
        null=True, blank=True,
        help_text='Exported file.'
    )
    layers = models.ManyToManyField(
        InputLayer,
        related_name="export_requests"
    )
    notes = models.TextField(
        blank=True,
        null=True
    )


class ExportedCog(models.Model):
    """Model to represent exported COG files."""
    input_layer = models.ForeignKey(
        "layers.InputLayer",
        on_delete=models.CASCADE
    )
    landscape_id = models.CharField(
        max_length=100
    )
    gdrive_file_id = models.CharField(
        max_length=200,
        null=True,
        blank=True,
    )
    file_name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    downloaded = models.BooleanField(
        default=False
    )

    def __str__(self):
        return f"{self.file_name} ({self.input_layer.name})"


class ExternalLayerSource(models.Model):
    FETCH_TYPE_CHOICES = [
        ("api", "API"),
        ("file", "File URL"),
        ("gee", "Google Earth Engine"),
        ("manual", "Manual Upload"),
    ]

    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
        ("monthly", "Monthly"),
        ("manual", "Manual"),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="Short unique identifier for this data source (e.g., 'wri')"
    )
    provider = models.ForeignKey(
        DataProvider, on_delete=models.CASCADE, related_name="sources"
    )
    url = models.URLField(
        blank=True, null=True, help_text="API or file endpoint URL"
    )
    description = models.TextField(blank=True, null=True)
    fetch_type = models.CharField(
        max_length=20, choices=FETCH_TYPE_CHOICES, default="manual"
    )
    frequency = models.CharField(
        max_length=20, choices=FREQUENCY_CHOICES, default="manual"
    )
    active = models.BooleanField(default=True)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Optional custom fetch options like band, CRS, token...",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "External Layer Source"
        verbose_name_plural = "External Layer Sources"
        ordering = ["provider", "name"]

    def __str__(self):
        return f"{self.provider.name} - {self.name}"


class ExternalLayer(models.Model):
    LAYER_TYPE_CHOICES = [
        ("raster", "Raster"),
        ("vector", "Vector"),
        ("json", "JSON"),
    ]

    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    name = models.CharField(max_length=255)
    layer_type = models.CharField(max_length=20, choices=LAYER_TYPE_CHOICES)
    source = models.ForeignKey(
        ExternalLayerSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="external_layers",
        help_text="The dataset source this layer came from."
    )
    metadata = models.JSONField(default=dict, blank=True, null=True)

    file = models.FileField(
        upload_to="external_layers/files/",
        null=True,
        blank=True,
        help_text="GeoTIFF, CSV, or JSON file for this layer.",
    )

    is_public = models.BooleanField(default=True)
    is_auto_published = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_external_layers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "External Layer"
        verbose_name_plural = "External Layers"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.source.name})"


class FetchHistory(models.Model):
    """Model to store the history of fetch operations for external layers."""
    source = models.ForeignKey(ExternalLayerSource, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20, choices=[("success", "Success"), ("failure", "Failure")]
    )
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        created = self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        return f"{self.source.name} - {self.status} - {created}"
