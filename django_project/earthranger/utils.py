import requests
from django.utils.timezone import now
from .models import APISchedule, EarthRangerObservation


def fetch_and_store_earth_ranger_data():
    api_url = "https://csah4h.pamdas.org/api/v1.0/observations/"
    headers = {
        "accept": "application/json",
        "X-CSRFToken":
        "2cUvjkb5KAccHVj2d3p3Opom4XZjIUXowmuwlSfxSlccl9EPLQIFAxXSLhxqMDYK",
        "Authorization": "Bearer b13cW8gQSIYhBuCIyBkutf7VXtXjTX"
    }

    response = requests.get(api_url, headers=headers)

    if response.status_code == 200:
        data = response.json()

        # Always replace the old data with new data
        EarthRangerObservation.objects.update_or_create(
            name="Earth Ranger Observations",
            defaults={"data": data, "last_updated": now()}
        )

        # Update the schedule log
        APISchedule.objects.filter(
            name="Earth Ranger Fetch Job"
        ).update(last_run_at=now())

        print("Earth Ranger data updated successfully.")

    else:
        print(
            f"Failed to fetch data: {response.status_code} - {response.text}"
        )
