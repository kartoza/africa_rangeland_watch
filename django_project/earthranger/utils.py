import time
import logging
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


def fetch_and_store_data(
        endpoint, model_class, name,
        max_retries: int = 3, retry_delay: float = 1.0):
    api_url = f"{settings.EARTH_RANGER_API_URL}{endpoint}/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
    }
    fetch_data = True
    retry_count = 0

    while fetch_data:
        try:
            response = requests.get(api_url, headers=headers, timeout=30)

            if response.status_code == 200:
                data = response.json()

                if model_class == EarthRangerEvents:
                    for feature in data['data']['results']:
                        # Always replace the old data with new data
                        try:
                            geom = GEOSGeometry(
                                json.dumps(feature['geojson']['geometry'])
                            )
                            model_class.objects.update_or_create(
                                earth_ranger_uuid=feature['id'],
                                defaults={
                                    "data": feature,
                                    "updated_at": now(),
                                    "geometry": geom
                                }
                            )
                        except (GDALException, TypeError) as e:
                            logging.warning(
                                f"Failed to process feature"
                                f"{feature.get('id', 'unknown')}: {e}"
                            )
                            pass

                    if data['data']['next']:
                        api_url = data['data']['next']
                        retry_count = 0  # Reset retry count for next page
                    else:
                        fetch_data = False
                else:
                    fetch_data = False

            elif response.status_code in [429, 500, 502, 503, 504]:
                # Retry on rate limiting and server errors
                retry_count += 1
                if retry_count <= max_retries:
                    wait_time = retry_delay * (2 ** (retry_count - 1))
                    logging.warning(
                        f"Request failed with status {response.status_code}. "
                        f"Retrying in {wait_time} seconds... "
                        f"(attempt {retry_count}/{max_retries})"
                    )
                    time.sleep(wait_time)
                else:
                    logging.error(
                        f"Failed to fetch {name} data "
                        f"after {max_retries} retries: "
                        f"{response.status_code} - {response.text}"
                    )
                    fetch_data = False
            else:
                # Don't retry on client errors (4xx except 429)
                logging.error(
                    f"Failed to fetch {name} data: "
                    f"{response.status_code} - {response.text}"
                )
                fetch_data = False

        except requests.exceptions.Timeout:
            retry_count += 1
            if retry_count <= max_retries:
                wait_time = retry_delay * (2 ** (retry_count - 1))
                logging.warning(
                    f"Request timed out. Retrying in {wait_time} seconds... "
                    f"(attempt {retry_count}/{max_retries})"
                )
                time.sleep(wait_time)
            else:
                logging.error(
                    f"Failed to fetch {name} data after "
                    f"{max_retries} timeout retries"
                )
                fetch_data = False

        except requests.exceptions.ConnectionError:
            retry_count += 1
            if retry_count <= max_retries:
                wait_time = retry_delay * (2 ** (retry_count - 1))
                logging.warning(
                    f"Connection error. Retrying in {wait_time} seconds... "
                    f"(attempt {retry_count}/{max_retries})"
                )
                time.sleep(wait_time)
            else:
                logging.error(
                    f"Failed to fetch {name} data after "
                    f"{max_retries} connection retries"
                )
                fetch_data = False

        except requests.exceptions.RequestException as e:
            retry_count += 1
            if retry_count <= max_retries:
                wait_time = retry_delay * (2 ** (retry_count - 1))
                logging.warning(
                    f"Request exception: {e}. Retrying in"
                    "{wait_time} seconds... "
                    f"(attempt {retry_count}/{max_retries})"
                )
                time.sleep(wait_time)
            else:
                logging.error(
                    f"Failed to fetch {name} data after "
                    f"{max_retries} retries due to: {e}"
                )
                fetch_data = False

        except Exception as e:
            logging.error(f"Unexpected error while fetching {name} data: {e}")
            fetch_data = False


# Function to fetch all Earth Ranger data
def fetch_all_earth_ranger_data():
    # fetch_and_store_data(
    #     "observations",
    #     EarthRangerObservation, "Observations"
    # )
    # fetch_and_store_data("features", EarthRangerFeature, "Features")
    # fetch_and_store_data("layers", EarthRangerLayer, "Layers")
    # fetch_and_store_data("mapping", EarthRangerMapping, "Mapping")
    events_url = (
        'activity/events?include_notes=true&include_related_events=true&state=active&state='  # noqa: E501
        'new&filter={"text":"","sort":["down",{"value":"updated_at","key":"updatedAtLabel"}]}&'  # noqa: E501
        'include_updates=false&sort_by=-updated_at'
    )
    fetch_and_store_data(events_url, EarthRangerEvents, "Events")

    # Update the schedule log
    APISchedule.objects.update_or_create(
        name="Earth Ranger Fetch Job",
        defaults={"last_run_at": now()}
    )
