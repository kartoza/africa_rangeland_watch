# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Preferences

"""

from django.db import models
from django.contrib.auth.models import User


class SingletonModel(models.Model):
    """Singleton Abstract Model that just have 1 data on database."""

    class Meta:  # noqa: D106
        abstract = True

    def save(self, *args, **kwargs):
        """Save model."""
        self.pk = 1
        super(SingletonModel, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Delete model."""
        pass

    @classmethod
    def load(cls):
        """Load the singleton model with 1 object."""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj


def default_map_initial_bound():
    """Default for map initial bound."""
    return [
        -8.143756703599479,
        -38.91531432942416,
        65.26520389206175,
        -2.025356218538789
    ]


class Preferences(SingletonModel):
    """Preference settings specifically for ARW."""

    map_initial_bound = models.JSONField(
        default=default_map_initial_bound,
        blank=True,
        help_text="Map initial bound"
    )

    spatial_reference_layer_max_area = models.IntegerField(
        default=500000000
    )

    worker_layer_api_key = models.TextField(
        null=True,
        blank=True,
        help_text=(
            "API Key that is used by worker to upload pmtiles to Django."
        )
    )


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    last_page = models.CharField(max_length=255, null=True, blank=True)
    analysis_state = models.JSONField(default=dict)
    activity_data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session for {self.user.username}"