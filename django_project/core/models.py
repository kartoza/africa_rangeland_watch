# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Preferences

"""

from django.db import models


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