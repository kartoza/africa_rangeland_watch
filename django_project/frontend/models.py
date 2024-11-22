# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Models for frontend app
"""
from django.db import models


class BaseMap(models.Model):
    """Base map model."""

    name = models.CharField(
        max_length=255,
        help_text="Name of the base map."
    )

    url = models.URLField(
        help_text=(
            "URL for the base map."
        )
    )

    thumbnail = models.FileField(
        upload_to='base_map/thumbnails/',
        blank=True,
        null=True,
        help_text=(
            "Thumbnail for the base map."
        )
    )

    class Meta:
        verbose_name = "Base Map"
        verbose_name_plural = "Base Maps"
        ordering = ['name']

    def __str__(self):
        return self.name
