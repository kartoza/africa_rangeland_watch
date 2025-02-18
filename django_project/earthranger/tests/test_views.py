from django.test import TestCase
from django.utils.timezone import now
from unittest.mock import patch, MagicMock
from earthranger.models import EarthRangerObservation
from earthranger.utils import fetch_and_store_earth_ranger_data


class EarthRangerFetchTest(TestCase):

    @patch("your_app.utils.requests.get")  # Mock API request
    def test_fetch_and_store_earth_ranger_data(self, mock_get):
        """
        Test if the API call fetches data and stores it correctly.
        """
        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "observations": [
                {"id": 1, "species": "Elephant", "location": "Park A"},
                {"id": 2, "species": "Lion", "location": "Park B"}
            ]
        }
        mock_get.return_value = mock_response

        # Ensure database is empty before running function
        self.assertEqual(EarthRangerObservation.objects.count(), 0)

        # Run the function
        fetch_and_store_earth_ranger_data()

        # Ensure a record was created
        self.assertEqual(EarthRangerObservation.objects.count(), 1)

        # Verify the data was stored correctly
        obj = EarthRangerObservation.objects.first()
        self.assertEqual(obj.data["observations"][0]["species"], "Elephant")
        self.assertEqual(obj.data["observations"][1]["species"], "Lion")

    @patch("your_app.utils.requests.get")  # Mock API request
    def test_fetch_api_failure(self, mock_get):
        """
        Test API failure handling.
        """
        mock_response = MagicMock()
        mock_response.status_code = 500  # Simulate server error
        mock_get.return_value = mock_response

        # Run the function (should not store anything)
        fetch_and_store_earth_ranger_data()

        # Ensure no data was stored in case of API failure
        self.assertEqual(EarthRangerObservation.objects.count(), 0)

    @patch("your_app.utils.requests.get")  # Mock API request
    def test_fetch_updates_existing_record(self, mock_get):
        """
        Test that running the function multiple times updates the same record.
        """
        # Create an existing record
        EarthRangerObservation.objects.create(
            name="Earth Ranger Observations",
            data={"observations": [{"id": 1, "species": "Giraffe", "location": "Park C"}]},
            last_updated=now()
        )

        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "observations": [
                {"id": 3, "species": "Rhino", "location": "Park D"}
            ]
        }
        mock_get.return_value = mock_response

        # Run the function again
        fetch_and_store_earth_ranger_data()

        # Ensure we still have only one record
        self.assertEqual(EarthRangerObservation.objects.count(), 1)

        # Check that data was updated
        obj = EarthRangerObservation.objects.first()
        self.assertEqual(obj.data["observations"][0]["species"], "Rhino")
