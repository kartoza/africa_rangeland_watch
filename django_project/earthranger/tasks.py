import logging
from celery import shared_task
from django.utils.timezone import now
from earthranger.utils import (
    fetch_and_store_data,
    get_grouped_settings
)
from earthranger.models import EarthRangerEvents, APISchedule

logger = logging.getLogger(__name__)


@shared_task
def scheduled_fetch():
    """Run scheduled API fetch tasks based on set intervals."""

    fetch_all_earth_ranger_data()


@shared_task
def fetch_earth_ranger_events(setting_ids=None):
    if setting_ids:
        logger.info(f"Fetching EarthRanger events for settings: {setting_ids}")
    else:
        logger.info(
            "Fetching EarthRanger events for default EarthRanger settings"
        )
    events_url = (
        'activity/events?include_notes=true&include_related_events=true&state=active&state='  # noqa: E501
        'new&filter={"text":"","sort":["down",{"value":"updated_at","key":"updatedAtLabel"}]}&'  # noqa: E501
        'include_updates=false&sort_by=-updated_at'
    )
    fetch_and_store_data(events_url, EarthRangerEvents, setting_ids)


# Function to fetch all Earth Ranger data
def fetch_all_earth_ranger_data():
    # then fetch for user's EarthRangers
    groups = get_grouped_settings()
    for (url, token), group_settings in groups.items():
        fetch_earth_ranger_events.delay(group_settings)

    # Get or create the schedule object
    schedule, _ = APISchedule.objects.get_or_create(
        name="Earth Ranger Fetch Job",
        defaults={
            "last_run_at": now()
        }
    )

    # Always update last_run_at regardless of whether
    # it was created or already existed
    schedule.last_run_at = now()
    schedule.save()
