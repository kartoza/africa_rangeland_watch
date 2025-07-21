import logging
from celery import shared_task
from earthranger.utils import fetch_all_earth_ranger_data, fetch_and_store_data
from earthranger.models import EarthRangerEvents

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
