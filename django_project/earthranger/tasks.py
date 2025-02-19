from celery import shared_task
from django.utils.timezone import now
from earthranger.models import APISchedule
from earthranger.utils import fetch_all_earth_ranger_data



@shared_task
def scheduled_fetch():
    """Run scheduled API fetch tasks based on set intervals."""
    schedules = (
        APISchedule.objects.filter(run_every_minutes__gt=0) |
        APISchedule.objects.filter(custom_interval__gt=0)
    )

    for schedule in schedules:
        fetch_all_earth_ranger_data()
        schedule.last_run_at = now()
        schedule.save()
