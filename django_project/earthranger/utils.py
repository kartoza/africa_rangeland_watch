import requests
import json
from django.utils.timezone import now
from django.contrib.gis.gdal.error import GDALException
from django.contrib.gis.geos import GEOSGeometry
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
        "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
    }
    fetch_data = True

    while fetch_data:
        response = requests.get(api_url, headers=headers)

        if response.status_code == 200:
            data = response.json()

            if model_class == EarthRangerEvents:
                for feature in data['features']:
                    # Always replace the old data with new data
                    try:
                        geom = GEOSGeometry(json.dumps(feature['geometry']))
                        model_class.objects.update_or_create(
                            earth_ranger_uuid=feature['properties']['id'],
                            defaults={
                                "data": feature['properties'], 
                                "updated_at": now(),
                                "geometry": geom
                            }
                        )
                    except GDALException:
                        pass

                print(f"events data updated successfully.")
                if data['next']:
                    api_url = data['next']
                else:
                    fetch_data = False

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
    fetch_and_store_data("/activity/events/geojson", EarthRangerEvents, "Events")

    # Update the schedule log
    APISchedule.objects.update_or_create(
        name="Earth Ranger Fetch Job",
        defaults={"last_run_at": now()}
    )
