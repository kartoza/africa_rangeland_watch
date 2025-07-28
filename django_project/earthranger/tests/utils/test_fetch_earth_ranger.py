import json
import pytest
from unittest.mock import Mock, patch
from django.test import TestCase, override_settings
from django.utils.timezone import now
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.gdal.error import GDALException
from django.conf import settings

from core.factories import UserF as UserFactory
from earthranger.utils import fetch_and_store_data, fetch_all_earth_ranger_data
from earthranger.models import EarthRangerEvents
from earthranger.factories import EarthRangerSettingFactory


@override_settings(
    EARTH_RANGER_API_URL='https://example.com/api', 
    EARTH_RANGER_AUTH_TOKEN='test-token'
)
class TestFetchAndStoreData(TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.user = UserFactory()
        self.setting = EarthRangerSettingFactory(
            user=self.user,
            url='https://test.earthranger.com',
            token='test-setting-token'
        )
        
        self.mock_feature = {
            'id': '0b2711a4-ee4b-4e93-8f03-a97072c4783a',
            'geojson': {
                'geometry': {
                    'type': 'Point',
                    'coordinates': [1.0, 2.0]
                }
            },
            'properties': {
                'title': 'Test Event',
                'description': 'Test Description'
            }
        }
        
        self.mock_response_data = {
            'data': {
                'results': [self.mock_feature],
                'next': None
            }
        }
        
        self.mock_response_data_with_pagination = {
            'data': {
                'results': [self.mock_feature],
                'next': 'https://api.example.com/next-page'
            }
        }

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.now')
    def test_successful_fetch_and_store_single_page_default_settings(self, mock_now, mock_get):
        """Test successful data fetch and storage for single page with default settings"""
        # Setup mocks
        mock_time = now()
        mock_now.return_value = mock_time
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Execute function with default settings (no setting_ids)
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify API call uses default settings
        expected_url = f"{settings.EARTH_RANGER_API_URL}events/"
        expected_headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
        }
        mock_get.assert_called_once_with(expected_url, headers=expected_headers, timeout=30)
        
        # Verify data was stored
        event = EarthRangerEvents.objects.get(earth_ranger_uuid='0b2711a4-ee4b-4e93-8f03-a97072c4783a')
        self.assertEqual(event.data, self.mock_feature)
        self.assertIsInstance(event.geometry, GEOSGeometry)

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.now')
    def test_successful_fetch_and_store_with_setting_ids(self, mock_now, mock_get):
        """Test successful data fetch and storage with specific setting IDs"""
        # Setup mocks
        mock_time = now()
        mock_now.return_value = mock_time
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Execute function with setting IDs
        fetch_and_store_data('events', EarthRangerEvents, setting_ids=[self.setting.id])
        
        # Verify API call uses setting's URL and token
        expected_url = f"{self.setting.url}events/"
        expected_headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {self.setting.token}"
        }
        mock_get.assert_called_once_with(expected_url, headers=expected_headers, timeout=30)
        
        # Verify data was stored and associated with setting
        event = EarthRangerEvents.objects.get(earth_ranger_uuid='0b2711a4-ee4b-4e93-8f03-a97072c4783a')
        self.assertEqual(event.data, self.mock_feature)
        self.assertIn(self.setting.id, event.earth_ranger_settings.values_list('id', flat=True))

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.now')
    def test_successful_fetch_with_pagination(self, mock_now, mock_get):
        """Test successful data fetch with pagination"""
        mock_time = now()
        mock_now.return_value = mock_time
        
        # First response with next page
        first_response = Mock()
        first_response.status_code = 200
        first_response.json.return_value = self.mock_response_data_with_pagination
        
        # Second response without next page
        second_feature = {
            'id': '0cddf94d-bb86-4294-9ce3-1009d6068dbb',
            'geojson': {
                'geometry': {
                    'type': 'Point',
                    'coordinates': [3.0, 4.0]
                }
            }
        }
        second_response_data = {
            'data': {
                'results': [second_feature],
                'next': None
            }
        }
        second_response = Mock()
        second_response.status_code = 200
        second_response.json.return_value = second_response_data
        
        mock_get.side_effect = [first_response, second_response]
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify both API calls were made
        self.assertEqual(mock_get.call_count, 2)
        
        # Verify both records were stored
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        self.assertTrue(EarthRangerEvents.objects.filter(earth_ranger_uuid='0b2711a4-ee4b-4e93-8f03-a97072c4783a').exists())
        self.assertTrue(EarthRangerEvents.objects.filter(earth_ranger_uuid='0cddf94d-bb86-4294-9ce3-1009d6068dbb').exists())

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.logging.error')
    def test_api_error_response(self, mock_logging_error, mock_get):
        """Test handling of API error responses"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_get.return_value = mock_response
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify error was logged
        mock_logging_error.assert_called_once_with(
            "Failed to fetch <class 'earthranger.models.EarthRangerEvents'> data: 404 - Not Found"
        )
        
        # Verify no data was stored
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.logging.error')
    def test_api_error_with_retries(self, mock_logging_error, mock_get):
        """Test handling of retryable API errors"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_get.return_value = mock_response
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents, max_retries=2)
        
        # Verify retries were attempted
        self.assertEqual(mock_get.call_count, 3)  # Initial + 2 retries
        
        # Verify final error was logged
        mock_logging_error.assert_called_with(
            "Failed to fetch <class 'earthranger.models.EarthRangerEvents'> data after 2 retries: 500 - Internal Server Error"
        )

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.GEOSGeometry')
    @patch('earthranger.utils.now')
    def test_geometry_parsing_error_handling(self, mock_now, mock_geos_geometry, mock_get):
        """Test handling of geometry parsing errors"""
        mock_time = now()
        mock_now.return_value = mock_time
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Mock GEOSGeometry to raise GDALException
        mock_geos_geometry.side_effect = GDALException("Invalid geometry")
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify no data was stored due to geometry error
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.json.dumps')
    @patch('earthranger.utils.now')
    def test_json_serialization_error_handling(self, mock_now, mock_json_dumps, mock_get):
        """Test handling of JSON serialization errors"""
        mock_time = now()
        mock_now.return_value = mock_time
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Mock json.dumps to raise TypeError
        mock_json_dumps.side_effect = TypeError("Object not serializable")
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify no data was stored due to JSON error
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.now')
    def test_update_existing_record(self, mock_now, mock_get):
        """Test updating existing records"""
        # Create existing record
        existing_time = now()
        existing_event = EarthRangerEvents.objects.create(
            earth_ranger_uuid='0b2711a4-ee4b-4e93-8f03-a97072c4783a',
            data={'old': 'data'},
            updated_at=existing_time,
            geometry=GEOSGeometry('POINT(0 0)')
        )
        
        # Setup mocks for update
        new_time = now()
        mock_now.return_value = new_time
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify record was updated, not duplicated
        self.assertEqual(EarthRangerEvents.objects.count(), 1)
        
        updated_event = EarthRangerEvents.objects.get(earth_ranger_uuid='0b2711a4-ee4b-4e93-8f03-a97072c4783a')
        self.assertEqual(updated_event.data, self.mock_feature)

    @patch('earthranger.utils.requests.get')
    def test_non_earth_ranger_events_model(self, mock_get):
        """Test function behavior with non-EarthRangerEvents model"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Create a mock model class that's not EarthRangerEvents
        mock_model = Mock()
        
        # Execute function
        fetch_and_store_data('other-endpoint', mock_model)
        
        # Verify API call was made but no processing occurred
        expected_url = f"{settings.EARTH_RANGER_API_URL}other-endpoint/"
        expected_headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
        }
        mock_get.assert_called_once_with(expected_url, headers=expected_headers, timeout=30)

    @patch('earthranger.utils.requests.get')
    def test_empty_results(self, mock_get):
        """Test handling of empty results"""
        empty_response_data = {
            'data': {
                'results': [],
                'next': None
            }
        }
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = empty_response_data
        mock_get.return_value = mock_response
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents)
        
        # Verify no data was stored
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.logging.error')
    def test_invalid_setting_ids(self, mock_logging_error):
        """Test handling of invalid setting IDs"""
        # Execute function with non-existent setting ID
        fetch_and_store_data('events', EarthRangerEvents, setting_ids=[99999])
        
        # Verify error was logged
        mock_logging_error.assert_called_once_with("No setting found with ID: [99999]")
        
        # Verify no data was stored
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.time.sleep')
    def test_timeout_retry_logic(self, mock_sleep, mock_get):
        """Test timeout retry logic"""
        import requests
        
        # Mock timeout exception
        mock_get.side_effect = requests.exceptions.Timeout("Request timed out")
        
        # Execute function with retries
        fetch_and_store_data('events', EarthRangerEvents, max_retries=2)

    @patch('earthranger.utils.fetch_earth_ranger_events.delay')
    def test_fetch_all_earth_ranger_data_calls_fetch_earth_ranger_events(self, mock_fetch_task):
        """Test that fetch_all_earth_ranger_data calls fetch_earth_ranger_events task"""
        # Create an EarthRangerSetting
        setting = EarthRangerSettingFactory(
            user=self.user,
            url='https://test.earthranger.com',
            token='test-token',
            is_active=True
        )
        
        # Execute function
        fetch_all_earth_ranger_data()
        
        # Verify fetch_earth_ranger_events task was called once with the setting ID
        mock_fetch_task.assert_called_once_with([setting.id])

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_fetch_all_earth_ranger_data_groups_settings_by_url_token(self, mock_fetch_task):
        """Test that fetch_all_earth_ranger_data groups settings by URL and token"""
        # Create multiple settings with same URL/token
        setting1 = EarthRangerSettingFactory(
            user=self.user,
            url='https://same.earthranger.com',
            token='same-token',
            is_active=True
        )
        setting2 = EarthRangerSettingFactory(
            user=self.user,
            url='https://same.earthranger.com',
            token='same-token',
            is_active=True
        )
        
        # Create setting with different URL/token
        setting3 = EarthRangerSettingFactory(
            user=self.user,
            url='https://different.earthranger.com',
            token='different-token',
            is_active=True
        )
        
        # Execute function
        fetch_all_earth_ranger_data()
        
        # Verify fetch_earth_ranger_events task was called 7 times:
        # Three times for each setting when created

        # Then when calling fetch_all_earth_ranger_data:
        # Once for grouped settings (setting1 & setting2)
        # Once for setting3
        # Once for setting0
        # Once for default EarthRangerSetting
        self.assertEqual(mock_fetch_task.call_count, 7)
        
        # Verify the calls contain the correct setting IDs
        call_args_list = mock_fetch_task.call_args_list
        
        # One call should have both setting1 and setting2 IDs (grouped)
        grouped_call = []
        single_call = []
        
        for call in call_args_list:
            setting_ids = call[0][0]  # First argument of the call
            if len(setting_ids) == 2:
                grouped_call.append(setting_ids)
            elif len(setting_ids) == 1:
                single_call.append(setting_ids)
        
        # Verify grouped call contains setting1 and setting2
        self.assertTrue(len(grouped_call) > 0)
        self.assertIn([setting2.id, setting1.id], grouped_call)
        
        # Verify single call contains setting3
        self.assertTrue(len(single_call) > 0)
        self.assertIn([setting3.id], single_call)

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_fetch_all_earth_ranger_data_calls_fetch_earth_ranger_events(self, mock_fetch_task):
        """Test that fetch_all_earth_ranger_data calls fetch_earth_ranger_events task"""
        # Create an EarthRangerSetting
        setting = EarthRangerSettingFactory(
            user=self.user,
            url='https://test.earthranger.com',
            token='test-setting-token',
            is_active=True
        )
        
        # Execute function
        fetch_all_earth_ranger_data()
        
        # Verify fetch_earth_ranger_events task was called once with the setting ID
        self.assertEqual(mock_fetch_task.call_count, 3)
