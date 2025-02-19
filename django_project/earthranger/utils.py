import requests
from django.utils.timezone import now
from .models import (
    APISchedule,
    EarthRangerEvents
)
from django.conf import settings
import logging


def fetch_and_store_data(endpoint, model_class, name):
    api_url = f"{settings.EARTH_RANGER_API_URL}/{endpoint}/"
    headers = {
        "accept": "application/json",
        "X-CSRFToken": settings.EARTH_RANGER_CSRF_TOKEN,
        "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
    }

    response = requests.get(api_url, headers=headers)

    if response.status_code == 200:
        data = response.json()

        # Always replace the old data with new data
        model_class.objects.update_or_create(
            name=name,
            defaults={"data": data, "last_updated": now()}
        )

        print(f"{name} data updated successfully.")

    else:
        logging.error(
            f"Failed to fetch {name}"
            f"data: {response.status_code} - {response.text}"
        )


# Function to fetch all Earth Ranger data
def fetch_all_earth_ranger_data():
    # fetch_and_store_data(
    #     "observations",
    #     EarthRangerObservation, "Observations"
    # )
    # fetch_and_store_data("features", EarthRangerFeature, "Features")
    # fetch_and_store_data("layers", EarthRangerLayer, "Layers")
    # fetch_and_store_data("mapping", EarthRangerMapping, "Mapping")
    fetch_and_store_data("activity/events", EarthRangerEvents, "Events")

    # Update the schedule log
    APISchedule.objects.update_or_create(
        name="Earth Ranger Fetch Job",
        defaults={"last_run_at": now()}
    )
