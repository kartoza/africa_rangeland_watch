import uuid

from django.contrib.auth.models import Group, User
from django.db import models

from base.models import Organisation
from analysis.models import UserAnalysisResults


class Dashboard(models.Model):
    """Model to represent a user-configurable dashboard."""

    PRIVACY_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('organisation', 'Organisation'),
        ('restricted', 'Restricted'),
    ]

    uuid = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        help_text="Unique identifier for the dashboard."
    )

    title = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_dashboards",
        null=True,
        blank=True
    )


    organisations = models.ManyToManyField(
        Organisation,
        related_name="dashboards",
        help_text="Organisations associated with this dashboard.",
        blank=True
    )

    groups = models.ManyToManyField(
        Group,
        related_name="dashboards",
        help_text="Groups that have access to this dashboard.",
        blank=True
    )

    users = models.ManyToManyField(
        User,
        related_name="accessible_dashboards",
        help_text="Users who have access to this dashboard.",
        blank=True
    )

    config = models.JSONField(
        blank=True,
        null=True,
        help_text=(
            "Configuration settings for the dashboard stored in JSON format."
        )
    )

    privacy_type = models.CharField(
        max_length=20,
        choices=PRIVACY_TYPES,
        default='private',
        help_text="Privacy level of the dashboard."
    )

    analysis_results = models.ManyToManyField(
        UserAnalysisResults,
        related_name="dashboards",
        blank=True,
        help_text="Analysis results associated with this dashboard."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this dashboard was created."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="The date and time when this dashboard was last updated."
    )

    class Meta:
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        ordering = ['-created_at']

    def __str__(self):
        return f"Dashboard {self.uuid} ({self.privacy_type})"
