import time
import logging
import requests
import json
from django.utils.timezone import now
from django.contrib.gis.gdal.error import GDALException
from django.contrib.gis.geos import GEOSGeometry
from earthranger.models import (
    EarthRangerEvents,
    EarthRangerSetting
)
from django.conf import settings as django_settings


def get_base_api_url(url: str):
    """Get EarthRanger base API URL from the specified URL.
    Since we already check URL validity when creating
    EarthRanger settings, the URL is already correct. It's
    just the URL could be base URL e.g. https://<your_domain>.pamdas.org
    or base API URL https://<your_domain>.pamdas.org/api/v1.0/.

    Hence, this function only checks if the URL is API URL. If not,
    it will assume the URL is base URL and append '/api/v1.0/' to
    make it into API URL.

    Args:
        url (str): EarthRanger URL
    """

    api_url = ""
    if url.endswith("/api/v1.0/"):
        api_url = url
    else:
        api_url = f"{url.rstrip('/')}/api/v1.0/"

    return api_url


def fetch_and_store_data(
        endpoint, model_class, setting_ids=None,
        max_retries: int = 3, retry_delay: float = 1.0
):
    api_url = f"{django_settings.EARTH_RANGER_API_URL}{endpoint}/"
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {django_settings.EARTH_RANGER_AUTH_TOKEN}"
    }
    if setting_ids:
        setting = EarthRangerSetting.objects.filter(id__in=setting_ids).first()
        if not setting:
            logging.error(f"No setting found with ID: {setting_ids}")
            return

        base_api_url = get_base_api_url(setting.url)
        api_url = f"{base_api_url}{endpoint}/"
        headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {setting.token}"
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
                            event, created = model_class.objects.update_or_create(  # noqa
                                earth_ranger_uuid=feature['id'],
                                defaults={
                                    "data": feature,
                                    "updated_at": now(),
                                    "geometry": geom
                                }
                            )
                            if setting_ids:
                                event.earth_ranger_settings.add(*setting_ids)
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
                        f"Failed to fetch {model_class} data "
                        f"after {max_retries} retries: "
                        f"{response.status_code} - {response.text}"
                    )
                    fetch_data = False
            else:
                # Don't retry on client errors (4xx except 429)
                logging.error(
                    f"Failed to fetch {model_class} data: "
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
                    f"Failed to fetch {model_class} data after "
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
                    f"Failed to fetch {model_class} data after "
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
                    f"Failed to fetch {model_class} data after "
                    f"{max_retries} retries due to: {e}"
                )
                fetch_data = False

        except Exception as e:
            logging.error(
                f"Unexpected error while fetching {model_class} data: {e}"
            )
            fetch_data = False


def get_grouped_settings():
    """
    Group EarthRanger settings by same URL and token.
    Returns dict with (url, token) as key and list of settings as value.
    """
    from collections import defaultdict
    from earthranger.models import EarthRangerSetting

    # Get all active settings
    settings = EarthRangerSetting.objects.\
        filter(is_active=True).select_related('user')

    # Group by (url, token)
    groups = defaultdict(list)
    for setting in settings:
        key = (setting.url, setting.token)
        groups[key].append(setting.id)

    # Add default key if not present, for default EarthRanger settings
    default_key = (
        django_settings.EARTH_RANGER_API_URL,
        django_settings.EARTH_RANGER_AUTH_TOKEN
    )
    if default_key not in groups:
        groups[default_key] = []

    return dict(groups)


def check_token(url, token):
    """
    Check if the token is valid for the given URL
    """

    if url.endswith("/api/v1.0/"):
        url = url
    else:
        url = f"{url.rstrip('/')}/api/v1.0/"

    try:
        response = requests.get(
            f"{url.rstrip('/')}/activity/events/count/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException:
        return False
