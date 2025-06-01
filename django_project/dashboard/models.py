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
        help_text="Analysis results associated with this dashboard (Deprecated)."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this dashboard was created."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="The date and time when this dashboard was last updated."
    )

    metadata = models.JSONField(
        blank=True,
        null=True,
        help_text="Additional metadata for the dashboard stored in JSON format."
    )

    class Meta:
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        ordering = ['-created_at']

    def __str__(self):
        return f"Dashboard {self.uuid} ({self.privacy_type})"


class DashboardWidget(models.Model):
    """Class to represent a widget on a dashboard."""

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name="widgets",
        help_text="The dashboard this widget belongs to."
    )
    widget_type = models.CharField(
        max_length=50,
        help_text="Type of the widget (e.g., chart, table, etc.)."
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="Configuration settings for the widget stored in JSON format."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this widget was created."
    )
    updated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this widget was updated."
    )
    analysis_result = models.ForeignKey(
        UserAnalysisResults,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        help_text="Analysis result associated with this widget."
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order of the widget in the dashboard."
    )
    title = models.CharField(
        max_length=255,
        help_text="Title of the widget."
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description of the widget."
    )
    text_content = models.TextField(
        blank=True,
        null=True,
        help_text="Text content for the widget, if applicable."
    )
