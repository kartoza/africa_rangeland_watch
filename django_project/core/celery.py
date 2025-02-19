from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab
from earthranger.models import APISchedule
from django.db import OperationalError
import logging


logger = logging.getLogger(__name__)

# set the default Django settings module for the 'celery' program.
# this is also used in manage.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Get the base REDIS URL, default to redis' default
BASE_REDIS_URL = (
    f'redis://default:{os.environ.get("REDIS_PASSWORD", "")}'
    f'@{os.environ.get("REDIS_HOST", "")}',
)

app = Celery('africa-rangeland-watch')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

app.conf.broker_url = BASE_REDIS_URL

# this allows you to schedule items in the Django admin.
app.conf.beat_scheduler = 'django_celery_beat.schedulers.DatabaseScheduler'

# Static schedule tasks (your predefined tasks)
app.conf.beat_schedule = {
    'generate-baseline-nrt-layers': {
        'task': 'generate_baseline_nrt_layers',
        # Run everyday at 00:00 UTC
        'schedule': crontab(minute='00', hour='00'),
    },
    'clear-analysis-results-cache': {
        'task': 'clear_analysis_results_cache',
        # Run every hour
        'schedule': crontab(minute='00', hour='*'),
    },
}


def get_dynamic_schedule():
    """Fetch all active schedules and configure Celery Beat dynamically."""
    try:
        schedules = (
            APISchedule.objects.filter(run_every_minutes__gt=0) |
            APISchedule.objects.filter(custom_interval__gt=0)
        )

        schedule_config = {}
        for schedule in schedules:
            interval = schedule.get_effective_interval()
            schedule_config[f"task-{schedule.id}"] = {
                "task": "earthranger.tasks.scheduled_fetch",
                "schedule": crontab(minute=f"*/{interval}"),
            }

        return schedule_config
    except OperationalError as e:
        logger.warning(f"Database not ready: {e}")
        return {}


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    """Update beat schedule after Celery is fully initialized."""
    app.conf.beat_schedule.update(get_dynamic_schedule())
