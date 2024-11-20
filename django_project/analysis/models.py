import uuid
from django.contrib.gis.db import models
from django.contrib.auth.models import User

from alerts.models import Indicator


class InterventionArea(models.Model):
    """Model to represent a geographic or intervention area."""

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The name of the intervention area."
    )

    geom = models.GeometryField(
        srid=4326,
        blank=True,
        null=True,
        help_text="The spatial geometry of the intervention area."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=(
            "The date and time when this intervention area was created."
        )
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=(
            "The date and time when this intervention area was last updated."
        )
    )

    class Meta:
        verbose_name = "Intervention Area"
        verbose_name_plural = "Intervention Areas"
        ordering = ['name']

    def __str__(self):
        return self.name


class Analysis(models.Model):
    """Model to represent an analysis."""

    ANALYSIS_TYPES = [
        ('spatial', 'Spatial'),
        ('temporal', 'Temporal'),
        ('statistical', 'Statistical'),
    ]

    TEMPORAL_RESOLUTIONS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the analysis."
    )

    intervention_area = models.ForeignKey(
        InterventionArea,
        on_delete=models.CASCADE,
        related_name="analyses",
        help_text=(
            "The intervention area associated with this analysis."
        ),
        blank=True
    )

    indicator = models.ForeignKey(
        Indicator,
        on_delete=models.CASCADE,
        related_name="analyses",
        help_text="The indicator being analyzed.",
        blank=True,
    )

    analysis_type = models.CharField(
        max_length=20,
        choices=ANALYSIS_TYPES,
        default='spatial',
        help_text="Type of analysis performed."
    )

    temporal_resolution = models.CharField(
        max_length=20,
        choices=TEMPORAL_RESOLUTIONS,
        blank=True,
        null=True,
        help_text="The temporal resolution of the analysis, if applicable."
    )

    reference_period_start = models.DateField(
        help_text="The start date for the reference period of the analysis.",
        blank=True
    )

    reference_period_end = models.DateField(
        help_text="The end date for the reference period of the analysis.",
        blank=True
    )

    comparison_period_start = models.DateField(
        help_text="The start date for the comparison period of the analysis.",
        blank=True
    )

    comparison_period_end = models.DateField(
        help_text="The end date for the comparison period of the analysis.",
        blank=True
    )

    geom = models.GeometryField(
        srid=4326,
        blank=True,
        null=True,
        help_text=(
            "The spatial geometry of the analysis (e.g., area of interest)."
        )
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_analyses",
        help_text="User who created this analysis."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this analysis was created."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="The date and time when this analysis was last updated."
    )

    class Meta:
        verbose_name = "Analysis"
        verbose_name_plural = "Analyses"
        ordering = ['-created_at']

    def __str__(self):
        return f"Analysis {self.uuid}"


class Landscape(models.Model):
    """Model that represents the landscape."""

    name = models.CharField(
        max_length=255,
        help_text="The name of the landscape."
    )

    value = models.CharField(
        max_length=255,
        help_text="The value of the landscape."
    )

    bbox = models.PolygonField(
        srid=4326,
        blank=True,
        null=True,
        help_text="Bounding box of the landscape."
    )

    zoom = models.IntegerField(
        help_text="Zoom level of the landscape."
    )

    def __str__(self):
        return self.name
