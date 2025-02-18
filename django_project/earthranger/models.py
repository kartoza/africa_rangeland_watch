from django.db import models


class APISchedule(models.Model):
    name = models.CharField(max_length=255)
    run_every_minutes = models.IntegerField(
        help_text="Set interval in minutes"
    )
    last_run_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - Every {self.run_every_minutes} minutes"


class EarthRangerObservation(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        default="Earth Ranger Data"
    )
    data = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - Last Updated: {self.last_updated}"
