from django.test import TestCase
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from earthranger.models import EarthRangerEvents
from earthranger.views import ListEventsView


class ListEventsViewTestCase(TestCase):
    """Test cases for ListEventsView"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create test event data
        self.event1_data = {
            "id": "b3200c40-fabf-4a96-b9d4-c341eb0e301d",
            "event_type": "auc_sales",
            "event_category": "wildlife",
            "time": "2025-02-13T16:10:51.811000+02:00",
            "reported_by": {"name": "John Doe"},
            "location": {"latitude": -30.414029, "longitude": 28.431178},
            "priority_label": "Green",
            "event_details": {
                "Comment": "Test comment 1",
                "Auc_vill_name": "Mahasheng"
            }
        }
        
        self.event2_data = {
            "id": "2eea4b3b-0574-48e0-8c08-9f29d64ef2c7",
            "event_type": "poaching",
            "event_category": "security",
            "time": "2025-02-14T10:30:00.000000+02:00",
            "reported_by": {"name": "Jane Smith"},
            "location": {"latitude": -31.123456, "longitude": 29.654321},
            "priority_label": "Red",
            "event_details": {
                "Comment": "Test comment 2",
                "Auc_vill_name": "TestVillage"
            }
        }
        
        self.event3_data = {
            "id": "78fa52ac-2207-415b-8b64-1804664c23e7",
            "event_type": "auc_sales",
            "event_category": "wildlife",
            "time": "2025-02-15T14:45:30.000000+02:00",
            "reported_by": {"name": "Bob Wilson"},
            "location": {"latitude": -32.789012, "longitude": 30.345678},
            "priority_label": "Yellow",
            "event_details": {
                "Comment": "Test comment 3",
                "Auc_vill_name": "AnotherVillage"
            }
        }
        
        # Create EarthRangerEvents instances with data field containing event_data
        # geometry derived from data.location, earth_ranger_uuid from data.id
        self.event1 = EarthRangerEvents.objects.create(
            earth_ranger_uuid=self.event1_data["id"],
            data=self.event1_data,
            geometry=Point(
                self.event1_data["location"]["longitude"],
                self.event1_data["location"]["latitude"]
            )
        )
        
        self.event2 = EarthRangerEvents.objects.create(
            earth_ranger_uuid=self.event2_data["id"],
            data=self.event2_data,
            geometry=Point(
                self.event2_data["location"]["longitude"],
                self.event2_data["location"]["latitude"]
            )
        )
        
        self.event3 = EarthRangerEvents.objects.create(
            earth_ranger_uuid=self.event3_data["id"],
            data=self.event3_data,
            geometry=Point(
                self.event3_data["location"]["longitude"],
                self.event3_data["location"]["latitude"]
            )
        )
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access the endpoint"""
        response = self.client.get('/earthranger/events/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_access_allowed(self):
        """Test that authenticated users can access the endpoint"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/earthranger/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_all_events_returns_data_field(self):
        """Test that listing events returns the data field from each event"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if response has pagination structure
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertEqual(len(events), 3)
        
        # Verify that the returned data matches the stored data field
        event_ids = [event['id'] for event in events]
        self.assertIn(self.event1_data['id'], event_ids)
        self.assertIn(self.event2_data['id'], event_ids)
        self.assertIn(self.event3_data['id'], event_ids)
        
        # Verify complete data structure
        for event in events:
            if event['id'] == self.event1_data['id']:
                self.assertEqual(event['event_type'], self.event1_data['event_type'])
                self.assertEqual(event['location'], self.event1_data['location'])
                self.assertEqual(event['priority_label'], self.event1_data['priority_label'])
    
    def test_filter_by_event_type(self):
        """Test filtering events by event_type"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?event_type=auc_sales')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return 2 events with event_type 'auc_sales'
        self.assertEqual(len(events), 2)
        for event in events:
            self.assertEqual(event['event_type'], 'auc_sales')
    
    def test_filter_by_event_category(self):
        """Test filtering events by event_category"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?event_category=security')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return 1 event with event_category 'security'
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['event_category'], 'security')
        self.assertEqual(events[0]['id'], self.event2_data['id'])
    
    def test_filter_by_both_event_type_and_category(self):
        """Test filtering by both event_type and event_category"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?event_type=auc_sales&event_category=wildlife')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return 2 events matching both criteria
        self.assertEqual(len(events), 2)
        for event in events:
            self.assertEqual(event['event_type'], 'auc_sales')
            self.assertEqual(event['event_category'], 'wildlife')
    
    def test_filter_no_results(self):
        """Test filtering with criteria that return no results"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?event_type=nonexistent')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertEqual(len(events), 0)
    
    def test_simple_format_true(self):
        """Test simple format when simple=true"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?simple=true')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertGreater(len(events), 0)
        
        # Check that simplified format is used
        event = events[0]
        expected_fields = ['id', 'event_type', 'time', 'reported_by', 'location', 'priority_label', 'event_details']
        
        for field in expected_fields:
            self.assertIn(field, event)
        
        # Verify that reported_by is simplified to just the name
        if event['id'] == self.event1_data['id']:
            self.assertEqual(event['reported_by'], self.event1_data['reported_by']['name'])
            self.assertEqual(event['event_details']['Comment'], self.event1_data['event_details']['Comment'])
            self.assertEqual(event['event_details']['Auc_vill_name'], self.event1_data['event_details']['Auc_vill_name'])
    
    def test_simple_format_false(self):
        """Test simple format when simple=false (full data returned)"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?simple=false')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertGreater(len(events), 0)
        
        # Check that full format is used (reported_by should be an object)
        event = events[0]
        if event['id'] == self.event1_data['id']:
            self.assertEqual(event['reported_by'], self.event1_data['reported_by'])
    
    def test_pagination_response_structure(self):
        """Test that pagination returns correct response structure"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?page=1&page_size=2')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check pagination structure
        if 'results' in response.data:
            self.assertIn('count', response.data)
            self.assertIn('results', response.data)
            self.assertLessEqual(len(response.data['results']), 2)
    
    def test_queryset_filtering_database_level(self):
        """Test that filtering is applied at database level"""
        self.client.force_authenticate(user=self.user)
        
        # Test that JSONField filtering works correctly
        response = self.client.get('/earthranger/events/?event_type=poaching')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should only return the poaching event
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]['event_type'], 'poaching')
        self.assertEqual(events[0]['id'], self.event2_data['id'])
    
    def test_geometry_field_populated_correctly(self):
        """Test that geometry field is populated from location data"""
        # Verify that the geometry field was set correctly during setup
        event1_from_db = EarthRangerEvents.objects.get(earth_ranger_uuid=self.event1_data['id'])
        
        self.assertIsNotNone(event1_from_db.geometry)
        self.assertEqual(event1_from_db.geometry.x, self.event1_data['location']['longitude'])
        self.assertEqual(event1_from_db.geometry.y, self.event1_data['location']['latitude'])
    
    def test_earth_ranger_uuid_populated_correctly(self):
        """Test that earth_ranger_uuid is populated from event data id"""
        event1_from_db = EarthRangerEvents.objects.get(earth_ranger_uuid=self.event1_data['id'])
        
        self.assertEqual(str(event1_from_db.earth_ranger_uuid), self.event1_data['id'])
        self.assertEqual(event1_from_db.data['id'], self.event1_data['id'])
    
    def test_data_field_contains_complete_event_data(self):
        """Test that data field contains the complete event data"""
        event1_from_db = EarthRangerEvents.objects.get(earth_ranger_uuid=self.event1_data['id'])
        
        self.assertEqual(event1_from_db.data, self.event1_data)
        self.assertEqual(event1_from_db.data['event_type'], self.event1_data['event_type'])
        self.assertEqual(event1_from_db.data['location'], self.event1_data['location'])
        self.assertEqual(event1_from_db.data['event_details'], self.event1_data['event_details'])
    
    def test_multiple_filters_combined(self):
        """Test that multiple filters work together correctly"""
        # Create additional test data for more complex filtering
        additional_event_data = {
            "id": "c20d1af9-f6e8-4f1e-ad9a-af3f0465c193",
            "event_type": "poaching",
            "event_category": "wildlife",  # Different category for poaching
            "time": "2025-02-16T12:00:00.000000+02:00",
            "reported_by": {"name": "Test Reporter"},
            "location": {"latitude": -33.123456, "longitude": 31.654321},
            "priority_label": "Red"
        }
        
        EarthRangerEvents.objects.create(
            earth_ranger_uuid=additional_event_data["id"],
            data=additional_event_data,
            geometry=Point(
                additional_event_data["location"]["longitude"],
                additional_event_data["location"]["latitude"]
            )
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Test filtering by event_type=poaching should return 2 events now
        response = self.client.get('/earthranger/events/?event_type=poaching')
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        self.assertEqual(len(events), 2)
        
        # Test filtering by both event_type and event_category
        response = self.client.get('/earthranger/events/?event_type=poaching&event_category=security')
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        self.assertEqual(len(events), 1)  # Only the original poaching event with security category
        self.assertEqual(events[0]['id'], self.event2_data['id'])
    
    def test_case_insensitive_simple_parameter(self):
        """Test that simple parameter is case insensitive"""
        self.client.force_authenticate(user=self.user)
        
        test_cases = ['true', 'TRUE', 'True', '1', 'yes', 'YES']
        
        for simple_value in test_cases:
            response = self.client.get(f'/earthranger/events/?simple={simple_value}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Extract events from response
            if 'results' in response.data:
                events = response.data['results']
            else:
                events = response.data
            
            if len(events) > 0:
                event = events[0]
                # In simple format, reported_by should be a string, not an object
                if event['id'] == self.event1_data['id']:
                    self.assertIsInstance(event['reported_by'], str)
                    self.assertEqual(event['reported_by'], self.event1_data['reported_by']['name'])
    
    def test_non_simple_format_returns_full_data(self):
        """Test that non-simple format returns complete original data"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?simple=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Find event1 and verify it matches original data
        event1_response = None
        for event in events:
            if event['id'] == self.event1_data['id']:
                event1_response = event
                break
        
        self.assertIsNotNone(event1_response)
        self.assertEqual(event1_response, self.event1_data)
    
    def test_empty_queryset_handling(self):
        """Test handling when no events exist"""
        # Delete all events
        EarthRangerEvents.objects.all().delete()
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/earthranger/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
            self.assertEqual(response.data['count'], 0)
        else:
            events = response.data
        
        self.assertEqual(len(events), 0)
    
    def test_invalid_filter_values(self):
        """Test that invalid filter values don't cause errors"""
        self.client.force_authenticate(user=self.user)
        
        # Test with empty filter values
        response = self.client.get('/earthranger/events/?event_type=&event_category=')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with special characters
        response = self.client.get('/earthranger/events/?event_type=test%20type&event_category=test/category')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_pagination_with_filters(self):
        """Test that pagination works correctly with filters"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/earthranger/events/?event_type=auc_sales&page=1&page_size=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            self.assertEqual(len(response.data['results']), 1)
            self.assertIn('count', response.data)
            # Should have 2 total auc_sales events
            self.assertEqual(response.data['count'], 2)
    
    def test_view_serializer_class(self):
        """Test that the view uses correct serializer"""
        view = ListEventsView()
        from earthranger.serializers import EarthRangerEventsSerializer
        self.assertEqual(view.serializer_class, EarthRangerEventsSerializer)
    
    def test_view_pagination_class(self):
        """Test that the view uses correct pagination class"""
        view = ListEventsView()
        from core.pagination import Pagination
        self.assertEqual(view.pagination_class, Pagination)


    def test_simple_serializer_handles_none_fields(self):
        """Test that EarthRangerEventsSimpleSerializer handles None and missing fields correctly"""
        self.client.force_authenticate(user=self.user)
        
        # Create event with missing fields in data
        # Missing: time, reported_by, location, priority_label, event_details
        event_missing_fields = EarthRangerEvents.objects.create(
            earth_ranger_uuid="2e92f1d5-745c-4606-980a-77838690d73b",
            data={
                "id": "2e92f1d5-745c-4606-980a-77838690d73b",
                "event_type": "test_type"
            },
            geometry=Point(0, 0)
        )
        
        # Create event with None values for nested fields
        event_none_nested = EarthRangerEvents.objects.create(
            earth_ranger_uuid="9c231935-72c5-403a-af3e-e41138f1e80d",
            data={
                "id": "9c231935-72c5-403a-af3e-e41138f1e80d",
                "event_type": "test_type",
                "time": "2025-01-01T00:00:00Z",
                "reported_by": None,
                "location": {"latitude": 0, "longitude": 0},
                "priority_label": None,
                "event_details": None
            },
            geometry=Point(0, 0)
        )
        
        # Create event with non-dict reported_by and event_details
        event_invalid_types = EarthRangerEvents.objects.create(
            earth_ranger_uuid="d291bd52-4d4f-40d5-ab3a-6bcf8778b670",
            data={
                "id": "d291bd52-4d4f-40d5-ab3a-6bcf8778b670",
                "event_type": "test_type",
                "time": "2025-01-01T00:00:00Z",
                "reported_by": "string_instead_of_dict",
                "location": {"latitude": 0, "longitude": 0},
                "priority_label": "Green",
                "event_details": "string_instead_of_dict"
            },
            geometry=Point(0, 0)
        )
        
        response = self.client.get('/earthranger/events/?simple=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Extract events from response
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Find our test events in the response
        missing_fields_event = None
        none_nested_event = None
        invalid_types_event = None
        
        for event in events:
            if event.get('id') == "2e92f1d5-745c-4606-980a-77838690d73b":
                missing_fields_event = event
            elif event.get('id') == "9c231935-72c5-403a-af3e-e41138f1e80d":
                none_nested_event = event
            elif event.get('id') == "d291bd52-4d4f-40d5-ab3a-6bcf8778b670":
                invalid_types_event = event
        
        # Test event with missing fields
        self.assertIsNotNone(missing_fields_event)
        self.assertEqual(missing_fields_event['id'], '2e92f1d5-745c-4606-980a-77838690d73b')
        self.assertEqual(missing_fields_event['event_type'], 'test_type')
        self.assertEqual(missing_fields_event['time'], 'Unknown')
        self.assertEqual(missing_fields_event['reported_by'], 'Unknown')
        self.assertEqual(missing_fields_event['location'], {})
        self.assertEqual(missing_fields_event['priority_label'], 'Unknown')
        self.assertEqual(missing_fields_event['event_details'], {
            'Comment': 'Unknown',
            'Auc_vill_name': 'Unknown'
        })
        
        # Test event with None nested fields
        self.assertIsNotNone(none_nested_event)
        self.assertEqual(none_nested_event['id'], '9c231935-72c5-403a-af3e-e41138f1e80d')
        self.assertEqual(none_nested_event['event_type'], 'test_type')
        self.assertEqual(none_nested_event['time'], '2025-01-01T00:00:00Z')
        self.assertEqual(none_nested_event['reported_by'], 'Unknown')
        self.assertEqual(none_nested_event['location'], {"latitude": 0, "longitude": 0})
        self.assertEqual(none_nested_event['priority_label'], None)
        self.assertEqual(none_nested_event['event_details'], {
            'Comment': 'Unknown',
            'Auc_vill_name': 'Unknown'
        })
        
        # Test event with invalid types for nested fields
        self.assertIsNotNone(invalid_types_event)
        self.assertEqual(invalid_types_event['id'], 'd291bd52-4d4f-40d5-ab3a-6bcf8778b670')
        self.assertEqual(invalid_types_event['event_type'], 'test_type')
        self.assertEqual(invalid_types_event['time'], '2025-01-01T00:00:00Z')
        self.assertEqual(invalid_types_event['reported_by'], 'Unknown')  # String instead of dict
        self.assertEqual(invalid_types_event['location'], {"latitude": 0, "longitude": 0})
        self.assertEqual(invalid_types_event['priority_label'], 'Green')
        self.assertEqual(invalid_types_event['event_details'], {
            'Comment': 'Unknown',
            'Auc_vill_name': 'Unknown'
        })
        
        # Clean up test data
        event_missing_fields.delete()
        event_none_nested.delete()
        event_invalid_types.delete()
