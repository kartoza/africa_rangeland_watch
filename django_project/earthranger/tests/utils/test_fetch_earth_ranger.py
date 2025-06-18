import json
import pytest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase
from django.utils.timezone import now
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.gdal.error import GDALException
from django.conf import settings

from earthranger.utils import fetch_and_store_data
from earthranger.models import EarthRangerEvents


class TestFetchAndStoreData(TestCase):
    
    def setUp(self):
        """Set up test data"""
        self.mock_feature = {
            'id': 'test-uuid-123',
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
    def test_successful_fetch_and_store_single_page(self, mock_now, mock_get):
        """Test successful data fetch and storage for single page"""
        # Setup mocks
        mock_time = now()
        mock_now.return_value = mock_time
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = self.mock_response_data
        mock_get.return_value = mock_response
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
        # Verify API call
        expected_url = f"{settings.EARTH_RANGER_API_URL}/events/"
        expected_headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
        }
        mock_get.assert_called_once_with(expected_url, headers=expected_headers)
        
        # Verify data was stored
        event = EarthRangerEvents.objects.get(earth_ranger_uuid='test-uuid-123')
        self.assertEqual(event.data, self.mock_feature)
        self.assertEqual(event.updated_at, mock_time)
        self.assertIsInstance(event.geometry, GEOSGeometry)

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
            'id': 'test-uuid-456',
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
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
        # Verify both API calls were made
        self.assertEqual(mock_get.call_count, 2)
        
        # Verify both records were stored
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        self.assertTrue(EarthRangerEvents.objects.filter(earth_ranger_uuid='test-uuid-123').exists())
        self.assertTrue(EarthRangerEvents.objects.filter(earth_ranger_uuid='test-uuid-456').exists())

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.logging.error')
    def test_api_error_response(self, mock_logging_error, mock_get):
        """Test handling of API error responses"""
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_get.return_value = mock_response
        
        # Execute function
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
        # Verify error was logged
        mock_logging_error.assert_called_once_with(
            "Failed to fetch Eventsdata: 404 - Not Found"
        )
        
        # Verify no data was stored
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

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
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
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
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
        # Verify no data was stored due to JSON error
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.requests.get')
    @patch('earthranger.utils.now')
    def test_update_existing_record(self, mock_now, mock_get):
        """Test updating existing records"""
        # Create existing record
        existing_time = now()
        existing_event = EarthRangerEvents.objects.create(
            earth_ranger_uuid='test-uuid-123',
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
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
        # Verify record was updated, not duplicated
        self.assertEqual(EarthRangerEvents.objects.count(), 1)
        
        updated_event = EarthRangerEvents.objects.get(earth_ranger_uuid='test-uuid-123')
        self.assertEqual(updated_event.data, self.mock_feature)
        self.assertEqual(updated_event.updated_at, new_time)
        self.assertNotEqual(updated_event.updated_at, existing_time)

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
        fetch_and_store_data('other-endpoint', mock_model, 'Other')
        
        # Verify API call was made but no processing occurred
        # (since the function only processes EarthRangerEvents)
        expected_url = f"{settings.EARTH_RANGER_API_URL}/other-endpoint/"
        expected_headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {settings.EARTH_RANGER_AUTH_TOKEN}"
        }
        mock_get.assert_called_once_with(expected_url, headers=expected_headers)
        
        # Verify model methods were not called
        mock_model.objects.update_or_create.assert_not_called()

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
        fetch_and_store_data('events', EarthRangerEvents, 'Events')
        
        # Verify no data was stored
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.utils.requests.get')
    def test_network_exception_handling(self, mock_get):
        """Test handling of network exceptions"""
        # Mock requests.get to raise an exception
        mock_get.side_effect = Exception("Network error")
        
        # Execute function and verify it raises the exception
        with self.assertRaises(Exception):
            fetch_and_store_data('events', EarthRangerEvents, 'Events')
