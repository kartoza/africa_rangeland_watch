from django.contrib.gis.db import models
from django.contrib.auth.models import User


class APISchedule(models.Model):
    SCHEDULE_CHOICES = [
        (5, "Every 5 minutes"),
        (1440, "Every day"),
        (10080, "Every week"),
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


class EarthRangerSetting(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="earthranger_settings",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255, unique=True)
    url = models.URLField(max_length=255)
    token = models.CharField(max_length=255)
    privacy = models.CharField(
        max_length=10,
        choices=[
            ("public", "Public"),
            ("private", "Private")
        ],
        default="public",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    def check_token(self):
        import requests
        try:
            response = requests.get(
                f"{self.url.rstrip('/')}/activity/events/count/",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException:
            return False

    def save(self, *args, **kwargs):
        from earthranger.tasks import fetch_earth_ranger_events

        is_new = not self.pk
        super().save(*args, **kwargs)

        # when adding new setting, assign existing events to new setting
        # based on similar URL and token. If not, fetch events
        if is_new:
            events = EarthRangerEvents.objects.filter(
                earth_ranger_settings__url=self.url,
                earth_ranger_settings__token=self.token,
            ).exclude(
                earth_ranger_settings=self
            ).distinct()
            if events.exists():
                for event in events:
                    event.earth_ranger_settings.add(self)
            else:
                fetch_earth_ranger_events.delay([self.pk])


class EarthRangerEvents(models.Model):
    earth_ranger_settings = models.ManyToManyField(
        EarthRangerSetting,
        related_name="events"
    )
    earth_ranger_uuid = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    data = models.JSONField(default=dict)
    geometry = models.GeometryField(null=True, blank=True)


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
