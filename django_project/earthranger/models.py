from django.db import models


class APISchedule(models.Model):
    SCHEDULE_CHOICES = [
        (5, "Every 5 minutes"),
        (1440, "Every day"),
        (43200, "Every month"),
        (0, "Stop Scheduling"),
    ]

    name = models.CharField(max_length=255, unique=True)
    run_every_minutes = models.IntegerField(
        choices=SCHEDULE_CHOICES,
        blank=True,
        null=True,
        help_text=(
            "Select a predefined schedule or "
            "leave blank to set a custom interval."
        )
    )
    custom_interval = models.IntegerField(
        blank=True,
        null=True,
        help_text=(
            "Enter a custom interval in "
            "minutes (if no predefined schedule is selected)."
        )
    )
    last_run_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        schedule_display = dict(
            self.SCHEDULE_CHOICES
        ).get(self.run_every_minutes, "Custom")
        return (
            f"{self.name} - {
                schedule_display
                if self.run_every_minutes
                else f'Custom: {self.custom_interval} min'
            }"
        )

    def is_active(self):
        return (
            self.run_every_minutes and self.run_every_minutes > 0
        ) or (self.custom_interval and self.custom_interval > 0)

    def get_effective_interval(self):
        """Return the selected schedule interval or the custom interval."""
        return (
            self.run_every_minutes
            if self.run_every_minutes else self.custom_interval
        )


class EarthRangerObservation(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        default="Observations"
    )
    data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - Last Updated: {self.last_updated}"


class EarthRangerFeature(models.Model):
    name = models.CharField(max_length=255, unique=True, default="Features")
    data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)


class EarthRangerLayer(models.Model):
    name = models.CharField(max_length=255, unique=True, default="Layers")
    data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)


class EarthRangerMapping(models.Model):
    name = models.CharField(max_length=255, unique=True, default="Mapping")
    data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)
