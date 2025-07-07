from celery import shared_task
from earthranger.utils import fetch_all_earth_ranger_data


@shared_task
def scheduled_fetch():
    """Run scheduled API fetch tasks based on set intervals."""

    fetch_all_earth_ranger_data()
