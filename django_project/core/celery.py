from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab
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

# Task cron job schedules
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
    'cleanup-old-export-request': {
        'task': 'cleanup_export_request',
        # Run everyday at 00:00 UTC
        'schedule': crontab(minute='00', hour='00'),
    },
    'process_alerts': {
        'task': 'alerts.tasks.process_alerts',
        # Run daily at 00:00 UTC
        'schedule': crontab(minute='00', hour='00'),
    },
    'export-all-nrt-cogs': {
        'task': 'export_all_nrt_cogs',
        # Run every day at 00:10 UTC
        # Runs after the baseline layers are generated
        'schedule': crontab(minute=10, hour=0),
    },
    'cleanup-exported-cogs-from-drive': {
        'task': 'cleanup_exported_cogs_from_drive',
        # Run every week on Monday at 00:00 UTC
        'schedule': crontab(minute='00', hour='00', day_of_week='1'),
    },
    'fetch_external_layers_task': {
        'task': 'fetch_external_layers_task',
        # Run every week on Monday at 00:00 UTC
        'schedule': crontab(minute='00', hour='00', day_of_week='1'),
    },
    'fetch-earth-rangers': {
        'task': 'earthranger.tasks.scheduled_fetch',
        # Run every week on Monday at 01:00 UTC
        'schedule': crontab(minute='00', hour='02', day_of_week='1'),
    }
}
