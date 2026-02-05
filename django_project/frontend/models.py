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
    default = models.BooleanField(
        default=False
    )

    class Meta:
        verbose_name = "Base Map"
        verbose_name_plural = "Base Maps"
        ordering = ['name']

    def save(self, *args, **kwargs):
        if self.default:
            # Set all other BaseMap objects to not default
            BaseMap.objects.exclude(pk=self.pk).update(default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class AssetUploadItem(models.Model):
    """Model to track asset upload items."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    file_name = models.CharField(
        max_length=255,
        help_text="Name of the uploaded file."
    )

    file_size = models.BigIntegerField(
        default=0,
        help_text="Size of the uploaded file in bytes."
    )

    upload_date = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when the file was uploaded."
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current status of the upload."
    )

    progress = models.FloatField(
        default=0.0,
        help_text="Upload progress percentage."
    )

    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if the upload failed."
    )

    uploaded_by = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        help_text="User who uploaded the asset."
    )

    session = models.CharField(
        max_length=255,
        help_text="Session ID for the upload."
    )

    file_id = models.CharField(
        blank=True,
        null=True,
        max_length=255,
        help_text="File ID for the uploaded asset."
    )

    upload_path = models.TextField(
        blank=True,
        null=True,
        help_text="Path where the file is uploaded."
    )

    class Meta:
        verbose_name = "Asset Upload Item"
        verbose_name_plural = "Asset Upload Items"
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.file_name} ({self.status})"
