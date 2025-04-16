from django.db import models
from django.contrib.auth.models import User


class Indicator(models.Model):
    """Model to represent an indicator used in analyses and alerts."""

    name = models.CharField(
        max_length=200,
        unique=True,
        help_text='The name of the indicator.'
    )

    class Meta:
        """Meta class for the Indicator model."""

        verbose_name = "Indicator"
        verbose_name_plural = "Indicators"
        ordering = ['name']

    def __str__(self):
        """String representation of the Indicator model."""
        return self.name


class AlertSetting(models.Model):
    """Model to define settings for alerts."""

    name = models.CharField(
        max_length=100,
        help_text="The name of the alert setting."
    )

    indicator = models.ForeignKey(
        'Indicator',
        on_delete=models.CASCADE,
    )

    enable_alert = models.BooleanField(
        default=False,
        help_text="Indicates if the alert is enabled."
    )

    last_alert = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the last triggered alert."
    )

    threshold_comparison = models.FloatField(
        default=0,
        help_text="Value for comparison to trigger an alert if exceeded."
    )

    threshold_value = models.FloatField(
        default=0,
        help_text="Threshold value to trigger the alert."
    )

    anomaly_detection_alert = models.BooleanField(
        default=False,
        help_text="Enable to trigger alerts for detected anomalies."
    )

    email_alert = models.BooleanField(
        default=False,
        help_text="Send alert notifications via email."
    )

    in_app_alert = models.BooleanField(
        default=False,
        help_text="Enable in-app alert notifications."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this alert setting was created."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="The date and time when this alert setting was last updated."
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="alert_settings",
        help_text="The user associated with this alert setting."
    )

    class Meta:
        """Meta class for the AlertSetting model."""

        verbose_name = "Alert Setting"
        verbose_name_plural = "Alert Settings"
        ordering = ['name']

    def __str__(self):
        """String representation of the AlertSetting model."""
        return self.name


class IndicatorAlertHistory(models.Model):
    """Model to store the history of alerts for a specific indicator."""

    text = models.TextField(
        blank=True,
        help_text='The text of the indicator alert history.'
    )

    alert_setting = models.ForeignKey(
        'AlertSetting',
        on_delete=models.CASCADE,
        related_name='alert_histories',
        help_text='The alert setting associated with this alert history.'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=(
            'The date and time when this alert '
            'history entry was created.'
        )
    )

    class Meta:
        """Meta class for the IndicatorAlertHistory model."""

        verbose_name = "Indicator Alert History"
        verbose_name_plural = "Indicator Alert Histories"
        ordering = ['-created_at']


class NotificationReadStatus(models.Model):
    """Model to track the read status of notifications."""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notification = models.ForeignKey(
        IndicatorAlertHistory, on_delete=models.CASCADE
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta class for the NotificationReadStatus model."""
        unique_together = ("user", "notification")
