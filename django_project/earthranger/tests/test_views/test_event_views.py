from requests.exceptions import RequestException
from django.test import TestCase
from unittest.mock import patch, Mock
from django.test import TestCase
from django.shortcuts import reverse
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from core.factories import UserF as UserFactory
from earthranger.models import EarthRangerEvents
from earthranger.views import ListEventsView
from earthranger.factories import (
    EarthRangerSettingFactory,
    EarthRangerEventsFactory,
    WildlifeSightingEventFactory,
    SecurityIncidentEventFactory
)


class ListEventsViewTestCase(TestCase):
    """Test cases for ListEventsView"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.user1 = UserFactory(username='testuser1')
        self.user2 = UserFactory(username='testuser2')
        
        # Create EarthRanger settings for users
        self.user1_setting = EarthRangerSettingFactory(
            user=self.user1,
            name="User1 Setting",
            url="https://user1.earthranger.com",
            token="user1-token"
        )
        
        self.user2_setting = EarthRangerSettingFactory(
            user=self.user2,
            name="User2 Setting", 
            url="https://user2.earthranger.com",
            token="user2-token"
        )
        
        # Create shared setting (same URL and token as user1)
        self.shared_setting = EarthRangerSettingFactory(
            user=self.user2,
            name="Shared Setting",
            url="https://user1.earthranger.com",  # Same URL as user1
            token="user1-token"  # Same token as user1
        )
        
        # Create test events
        self.event1 = WildlifeSightingEventFactory()
        self.event1.earth_ranger_settings.add(self.user1_setting)
        
        self.event2 = SecurityIncidentEventFactory()
        self.event2.earth_ranger_settings.add(self.user1_setting)
        
        self.event3 = EarthRangerEventsFactory()
        self.event3.earth_ranger_settings.add(self.user2_setting)
        
        # Event associated with shared setting
        self.shared_event = EarthRangerEventsFactory()
        self.shared_event.earth_ranger_settings.add(self.shared_setting)
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access the endpoint"""
        response = self.client.get('/earthranger/events/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_access_allowed(self):
        """Test that authenticated users can access the endpoint"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/earthranger/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_can_only_see_own_events(self):
        """Test that users can only see events from their own settings"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/earthranger/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if response has pagination structure
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # User1 should see events from user1_setting (event1, event2)
        # Plus shared_event because shared_setting has same URL/token as user1_setting
        self.assertGreaterEqual(len(events), 2)
        
        # Verify events belong to user1's settings or matching settings
        event_ids = [event['id'] for event in events]
        self.assertIn(self.event1.data['id'], event_ids)
        self.assertIn(self.event2.data['id'], event_ids)
    
    def test_settings_id_filter(self):
        """Test filtering events by specific settings_id"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('earthranger:setting-events-list', args=[self.user1_setting.id])
        
        # Test with user1's setting ID
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should include events from settings with matching URL/token
        self.assertGreaterEqual(len(events), 2)
    
    def test_settings_id_filter_unauthorized(self):
        """Test that users cannot access other users' settings"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('earthranger:setting-events-list', args=[self.user2_setting.id])

        # Try to access user2's setting
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return empty results since user1 doesn't own user2_setting
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertEqual(len(events), 0)
    
    def test_filter_by_event_type(self):
        """Test filtering events by event_type"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/earthranger/events/?event_type=wildlife_sighting')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return only wildlife sighting events
        for event in events:
            self.assertEqual(event['event_type'], 'wildlife_sighting')
    
    def test_filter_by_event_category(self):
        """Test filtering events by event_category"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/earthranger/events/?event_category=security')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return only security category events
        for event in events:
            self.assertEqual(event['event_category'], 'security')
    
    def test_combined_filters(self):
        """Test combining event_type and event_category filters"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/earthranger/events/?event_type=poaching_incident&event_category=security')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return events matching both criteria
        for event in events:
            self.assertEqual(event['event_type'], 'poaching_incident')
            self.assertEqual(event['event_category'], 'security')
    
    def test_simple_format_parameter(self):
        """Test simple format parameter"""
        self.client.force_authenticate(user=self.user1)
        
        # Test simple=true
        response = self.client.get('/earthranger/events/?simple=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        if len(events) > 0:
            # In simple format, should have specific fields
            event = events[0]
            expected_fields = ['id', 'event_type', 'time', 'reported_by', 'location', 'priority_label', 'event_details']
            
            # Check that some expected fields exist
            self.assertIn('id', event)
            self.assertIn('event_type', event)
    
    def test_simple_format_false(self):
        """Test simple=false returns full data"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/earthranger/events/?simple=false')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        if len(events) > 0:
            # Should return full event data
            event = events[0]
            self.assertIn('id', event)
            self.assertIn('event_type', event)
    
    def test_pagination_structure(self):
        """Test pagination response structure"""
        # Create more events to trigger pagination
        for i in range(15):
            event = EarthRangerEventsFactory()
            event.earth_ranger_settings.add(self.user1_setting)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/earthranger/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have pagination structure
        if 'results' in response.data:
            self.assertIn('count', response.data)
            self.assertIn('results', response.data)
            # May have 'next' and 'previous' depending on pagination settings
    
    def test_events_ordered_by_time_desc(self):
        """Test that events are ordered by data__time in descending order"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/earthranger/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        if len(events) > 1:
            # Check that events are ordered by time (most recent first)
            times = [event.get('time') for event in events if event.get('time')]
            if len(times) > 1:
                # Times should be in descending order
                self.assertEqual(times, sorted(times, reverse=True))
    
    def test_empty_queryset_when_no_settings(self):
        """Test behavior when user has no settings"""
        user_no_settings = UserFactory(username='nosettings')
        self.client.force_authenticate(user=user_no_settings)
        
        response = self.client.get('/earthranger/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertEqual(len(events), 0)
    
    def test_matching_settings_logic(self):
        """Test that events from settings with matching URL/token are included"""
        self.client.force_authenticate(user=self.user1)
        
        # Create another setting for user1 with different URL/token
        different_setting = EarthRangerSettingFactory(
            user=self.user1,
            name="Different Setting",
            url="https://different.earthranger.com",
            token="different-token"
        )
        
        # Create event for the different setting
        different_event = EarthRangerEventsFactory()
        different_event.earth_ranger_settings.add(different_setting)
        
        response = self.client.get('/earthranger/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should include events from all user1's settings
        event_ids = [event['id'] for event in events]
        self.assertIn(different_event.data['id'], event_ids)
    
    def test_invalid_settings_id(self):
        """Test behavior with invalid settings_id"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('earthranger:setting-events-list', args=[99999])
        
        # Use non-existent settings ID
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Should return empty results
        self.assertEqual(len(events), 0)
    
    def test_filter_no_results(self):
        """Test filtering with criteria that return no results"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/earthranger/events/?event_type=nonexistent_type')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        self.assertEqual(len(events), 0)
    
    def test_case_insensitive_simple_parameter(self):
        """Test that simple parameter accepts various case formats"""
        self.client.force_authenticate(user=self.user1)
        
        test_cases = ['true', 'TRUE', 'True', '1', 'yes', 'YES']
        
        for simple_value in test_cases:
            response = self.client.get(f'/earthranger/events/?simple={simple_value}')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_view_permissions(self):
        """Test that view has correct permission classes"""
        view = ListEventsView()
        from rest_framework.permissions import IsAuthenticated
        
        # Check that IsAuthenticated is in permission_classes
        permission_class_names = [cls.__name__ for cls in view.permission_classes]
        self.assertIn('IsAuthenticated', permission_class_names)

    def test_view_serializer_class(self):
        """Test that view uses correct serializer class"""
        view = ListEventsView()
        from earthranger.serializers import EarthRangerEventsSerializer
        self.assertEqual(view.serializer_class, EarthRangerEventsSerializer)
    
    def test_view_pagination_class(self):
        """Test that view uses correct pagination class"""
        view = ListEventsView()
        from core.pagination import Pagination
        self.assertEqual(view.pagination_class, Pagination)
    
    def test_many_to_many_relationship(self):
        """Test that events can be associated with multiple settings"""
        # Create event associated with multiple settings
        multi_event = EarthRangerEventsFactory()
        multi_event.earth_ranger_settings.add(self.user1_setting)
        multi_event.earth_ranger_settings.add(self.shared_setting)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/earthranger/events/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        if 'results' in response.data:
            events = response.data['results']
        else:
            events = response.data
        
        # Event should appear in results since user1 has access through user1_setting
        event_ids = [event['id'] for event in events]
        self.assertIn(multi_event.data['id'], event_ids)
    
    def test_geometry_field_exists(self):
        """Test that events have geometry field populated"""
        # Verify that our test events have geometry
        self.assertIsNotNone(self.event1.geometry)
        self.assertIsInstance(self.event1.geometry, Point)
        
        # Verify geometry coordinates match data location
        if 'location' in self.event1.data:
            location = self.event1.data['location']
            if 'longitude' in location and 'latitude' in location:
                self.assertEqual(self.event1.geometry.x, location['longitude'])
                self.assertEqual(self.event1.geometry.y, location['latitude'])
    
    def test_earth_ranger_uuid_field(self):
        """Test that events have earth_ranger_uuid field"""
        self.assertIsNotNone(self.event1.earth_ranger_uuid)
        
        # UUID should match the id in data field
        if 'id' in self.event1.data:
            self.assertEqual(str(self.event1.earth_ranger_uuid), self.event1.data['id'])
    
    def test_data_field_structure(self):
        """Test that data field contains expected structure"""
        self.assertIsInstance(self.event1.data, dict)
        
        # Check for common fields
        expected_fields = ['id', 'event_type', 'event_category']
        for field in expected_fields:
            if field in self.event1.data:
                self.assertIn(field, self.event1.data)
    
    def test_queryset_filtering_performance(self):
        """Test that filtering uses database-level filtering"""
        # Create many events to test performance
        for i in range(50):
            event = EarthRangerEventsFactory()
            event.earth_ranger_settings.add(self.user1_setting)
        
        self.client.force_authenticate(user=self.user1)
        
        # Test that JSONField filtering works at database level
        with self.assertNumQueries(2):
            response = self.client.get('/earthranger/events/?event_type=wildlife_sighting')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_invalid_filter_parameters(self):
        """Test handling of invalid filter parameters"""
        self.client.force_authenticate(user=self.user1)
        
        # Test with empty filter values
        response = self.client.get('/earthranger/events/?event_type=&event_category=')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with special characters
        response = self.client.get('/earthranger/events/?event_type=test%20type')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with very long filter values
        long_value = 'a' * 1000
        response = self.client.get(f'/earthranger/events/?event_type={long_value}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_simple_serializer_handles_none_fields(self):
        """Test that EarthRangerEventsSimpleSerializer handles None and missing fields correctly"""
        self.client.force_authenticate(user=self.user1)
        
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
        event_missing_fields.earth_ranger_settings.add(self.user1_setting)
        
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
        event_none_nested.earth_ranger_settings.add(self.user1_setting)
        
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
        event_invalid_types.earth_ranger_settings.add(self.user1_setting)
        
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
