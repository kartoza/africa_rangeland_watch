# coding=utf-8
"""
Trends.Earth models for ARW.
"""
from django.contrib.auth.models import User
from django.db import models


class TrendsEarthSetting(models.Model):
    """Per-user Trends.Earth credentials.

    Stores the user's email and a long-lived refresh token
    (obtained after the first successful authentication).
    The plaintext password is never persisted.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='trends_earth_setting',
        help_text='The ARW user who owns these credentials.'
    )
    email = models.EmailField(
        max_length=254,
        help_text='Trends.Earth account email address.'
    )
    refresh_token = models.TextField(
        blank=True,
        help_text=(
            'Long-lived Trends.Earth refresh token. '
            'Populated after first successful authentication.'
        )
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Date and time when this setting was created.'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Date and time when this setting was last updated.'
    )

    class Meta:
        verbose_name = 'Trends.Earth Setting'
        verbose_name_plural = 'Trends.Earth Settings'

    def __str__(self):
        return f'TrendsEarthSetting({self.user.username})'


class TrendsEarthJobType(models.TextChoices):
    """Type of Trends.Earth analysis job."""

    LDN = 'ldn', 'Land Degradation Neutrality (SDG 15.3.1)'
    DROUGHT = 'drought', 'Drought'
    URBANIZATION = 'urbanization', 'Sustainable Urbanization (SDG 11.3.1)'
    POPULATION = 'population', 'Population'


class TrendsEarthJobStatus(models.TextChoices):
    """Status of a Trends.Earth job."""

    PENDING = 'PENDING', 'Pending'
    RUNNING = 'RUNNING', 'Running'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class TrendsEarthJob(models.Model):
    """Job model for tracking Trends.Earth analysis submissions.

    This model tracks the submission and status of Trends.Earth
    analysis jobs. It stores the execution ID from Trends.Earth,
    job type, status, and results.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trends_earth_jobs',
        help_text='The user who submitted this job.'
    )
    execution_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Trends.Earth execution ID.'
    )
    job_type = models.CharField(
        max_length=20,
        choices=TrendsEarthJobType.choices,
        help_text='Type of Trends.Earth analysis.'
    )
    status = models.CharField(
        max_length=20,
        choices=TrendsEarthJobStatus.choices,
        default=TrendsEarthJobStatus.PENDING,
        help_text='Current status of the job.'
    )
    geojson = models.JSONField(
        null=True,
        blank=True,
        help_text='GeoJSON geometry for the area of interest.'
    )
    year_initial = models.IntegerField(
        null=True,
        blank=True,
        help_text='Initial year for the analysis.'
    )
    year_final = models.IntegerField(
        null=True,
        blank=True,
        help_text='Final year for the analysis.'
    )
    task_name = models.CharField(
        max_length=255,
        blank=True,
        help_text='Name of the task submitted to Trends.Earth.'
    )
    result = models.JSONField(
        default=dict,
        blank=True,
        help_text='Result data from Trends.Earth upon completion.'
    )
    error = models.JSONField(
        default=dict,
        blank=True,
        help_text='Error information if the job failed.'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Date and time when the job was created.'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Date and time when the job was last updated.'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date and time when the job completed.'
    )

    class Meta:
        verbose_name = 'Trends.Earth Job'
        verbose_name_plural = 'Trends.Earth Jobs'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f'TrendsEarthJob {self.pk} '
            f'({self.job_type}) [{self.status}]'
        )
