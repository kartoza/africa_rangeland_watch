from requests.exceptions import RequestException
from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from earthranger.models import EarthRangerSetting, EarthRangerEvents


class EarthRangerSettingDeleteTestCase(TestCase):
    """Test cases for EarthRangerSetting deletion and orphaned events cleanup."""

    def setUp(self):
        """Set up test data."""
        # Create test users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )

        # Create test settings
        self.setting1 = EarthRangerSetting.objects.create(
            user=self.user1,
            name='Test Setting 1',
            url='https://api1.earthranger.com',
            token='token123',
            privacy='public'
        )
        
        self.setting2 = EarthRangerSetting.objects.create(
            user=self.user2,
            name='Test Setting 2',
            url='https://api2.earthranger.com',
            token='token456',
            privacy='private'
        )
        
        self.setting3 = EarthRangerSetting.objects.create(
            user=self.user1,
            name='Test Setting 3',
            url='https://api3.earthranger.com',
            token='token789',
            privacy='public'
        )

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_delete_setting_with_orphaned_events(self, mock_fetch_task):
        """Test that orphaned events are deleted when a setting is deleted."""
        # Create events
        event1 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440001',
            data={'event': 'test1'}
        )
        event2 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440002',
            data={'event': 'test2'}
        )
        
        # Associate events with settings
        event1.earth_ranger_settings.add(self.setting1)  # Only associated with setting1
        event2.earth_ranger_settings.add(self.setting1, self.setting2)  # Associated with both settings
        
        # Verify initial state
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        self.assertEqual(event1.earth_ranger_settings.count(), 1)
        self.assertEqual(event2.earth_ranger_settings.count(), 2)
        
        # Delete setting1
        self.setting1.delete()
        
        # Verify results
        # event1 should be deleted (orphaned)
        # event2 should still exist (still has setting2)
        self.assertEqual(EarthRangerEvents.objects.count(), 1)
        self.assertFalse(EarthRangerEvents.objects.filter(id=event1.id).exists())
        self.assertTrue(EarthRangerEvents.objects.filter(id=event2.id).exists())
        
        # Verify event2 still has setting2
        remaining_event = EarthRangerEvents.objects.get(id=event2.id)
        self.assertEqual(remaining_event.earth_ranger_settings.count(), 1)
        self.assertEqual(remaining_event.earth_ranger_settings.first(), self.setting2)

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_delete_setting_no_orphaned_events(self, mock_fetch_task):
        """Test that no events are deleted when they still have associated settings."""
        # Create events
        event1 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440003',
            data={'event': 'test3'}
        )
        event2 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440004',
            data={'event': 'test4'}
        )
        
        # Associate events with multiple settings
        event1.earth_ranger_settings.add(self.setting1, self.setting2)
        event2.earth_ranger_settings.add(self.setting2, self.setting3)
        
        # Verify initial state
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        
        # Delete setting1
        self.setting1.delete()
        
        # Verify no events were deleted (both still have other associated settings)
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        
        # Verify associations are updated correctly
        event1_updated = EarthRangerEvents.objects.get(id=event1.id)
        event2_updated = EarthRangerEvents.objects.get(id=event2.id)
        
        self.assertEqual(event1_updated.earth_ranger_settings.count(), 1)
        self.assertEqual(event1_updated.earth_ranger_settings.first(), self.setting2)
        
        self.assertEqual(event2_updated.earth_ranger_settings.count(), 2)
        self.assertIn(self.setting2, event2_updated.earth_ranger_settings.all())
        self.assertIn(self.setting3, event2_updated.earth_ranger_settings.all())

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_delete_setting_mixed_scenario(self, mock_fetch_task):
        """Test mixed scenario with both orphaned and non-orphaned events."""
        # Create events
        event1 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440005',
            data={'event': 'test5'}
        )
        event2 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440006',
            data={'event': 'test6'}
        )
        event3 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440007',
            data={'event': 'test7'}
        )
        
        # Different association patterns
        event1.earth_ranger_settings.add(self.setting1)  # Will be orphaned
        event2.earth_ranger_settings.add(self.setting1, self.setting2)  # Will survive
        event3.earth_ranger_settings.add(self.setting2)  # Unaffected
        
        # Verify initial state
        self.assertEqual(EarthRangerEvents.objects.count(), 3)
        
        # Delete setting1
        self.setting1.delete()
        
        # Verify results
        # event1 should be deleted (orphaned)
        # event2 and event3 should remain
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        self.assertFalse(EarthRangerEvents.objects.filter(id=event1.id).exists())
        self.assertTrue(EarthRangerEvents.objects.filter(id=event2.id).exists())
        self.assertTrue(EarthRangerEvents.objects.filter(id=event3.id).exists())

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_delete_setting_no_events(self, mock_fetch_task):
        """Test deleting a setting that has no associated events."""
        # Verify initial state - no events
        self.assertEqual(EarthRangerEvents.objects.count(), 0)
        
        # Delete setting1 (no events associated)
        setting_id = self.setting1.id
        self.setting1.delete()
        
        # Verify setting was deleted and no errors occurred
        self.assertFalse(EarthRangerSetting.objects.filter(id=setting_id).exists())
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_delete_multiple_settings_cascade_cleanup(self, mock_fetch_task):
        """Test deleting multiple settings and proper cascade cleanup."""
        # Create events
        event1 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440008',
            data={'event': 'test8'}
        )
        event2 = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440009',
            data={'event': 'test9'}
        )
        
        # Associate events
        event1.earth_ranger_settings.add(self.setting1, self.setting2)
        event2.earth_ranger_settings.add(self.setting1, self.setting2, self.setting3)
        
        # Verify initial state
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        
        # Delete setting1 first
        self.setting1.delete()
        
        # Both events should still exist (they have other settings)
        self.assertEqual(EarthRangerEvents.objects.count(), 2)
        
        # Delete setting2
        self.setting2.delete()
        
        # event1 should now be orphaned and deleted
        # event2 should still exist (has setting3)
        self.assertEqual(EarthRangerEvents.objects.count(), 1)
        self.assertFalse(EarthRangerEvents.objects.filter(id=event1.id).exists())
        self.assertTrue(EarthRangerEvents.objects.filter(id=event2.id).exists())
        
        # Delete setting3
        self.setting3.delete()
        
        # Now event2 should also be deleted (orphaned)
        self.assertEqual(EarthRangerEvents.objects.count(), 0)

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    @patch('builtins.print')
    def test_cleanup_signal_logging(self, mock_print, mock_fetch_task):
        """Test that the cleanup signal logs the deletion of orphaned events."""
        # Create an event that will be orphaned
        event = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440010',
            data={'event': 'test10'}
        )
        event.earth_ranger_settings.add(self.setting1)
        
        # Delete the setting
        setting_name = self.setting1.name
        self.setting1.delete()
        
        # Verify the print statement was called with expected message
        mock_print.assert_called_with(
            f"Deleted 1 orphaned EarthRanger events after deleting setting: {setting_name}"
        )

    def test_setting_str_method(self):
        """Test the __str__ method of EarthRangerSetting."""
        self.assertEqual(str(self.setting1), 'Test Setting 1')

    @patch('requests.get')
    def test_check_token_success(self, mock_get):
        """Test successful token validation."""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.setting1.check_token()
        
        self.assertTrue(result)
        mock_get.assert_called_once_with(
            f"{self.setting1.url}/activity/events/count/",
            headers={"Authorization": f"Bearer {self.setting1.token}"},
            timeout=10
        )

    @patch('requests.get')
    def test_check_token_failure(self, mock_get):
        """Test failed token validation."""
        # Mock failed response
        mock_get.side_effect = RequestException("Connection error")
        
        result = self.setting1.check_token()
        
        self.assertFalse(result)

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_save_new_setting_with_existing_events(self, mock_fetch_task):
        """Test saving a new setting when events with same URL/token exist."""
        # Create an existing event with same URL and token
        existing_event = EarthRangerEvents.objects.create(
            earth_ranger_uuid='550e8400-e29b-41d4-a716-446655440011',
            data={'event': 'existing'}
        )
        existing_event.earth_ranger_settings.add(self.setting1)
        
        # Create new setting with same URL and token
        new_setting = EarthRangerSetting(
            user=self.user2,
            name='New Setting Same URL',
            url=self.setting1.url,
            token=self.setting1.token,
            privacy='private'
        )
        new_setting.save()
        
        # Verify the existing event is now associated with both settings
        existing_event.refresh_from_db()
        self.assertEqual(existing_event.earth_ranger_settings.count(), 2)
        self.assertIn(self.setting1, existing_event.earth_ranger_settings.all())
        self.assertIn(new_setting, existing_event.earth_ranger_settings.all())
        
        # Verify fetch task was not called (events already exist)
        mock_fetch_task.assert_not_called()

    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    def test_save_new_setting_no_existing_events(self, mock_fetch_task):
        """Test saving a new setting when no events with same URL/token exist."""
        # Create new setting with unique URL and token
        new_setting = EarthRangerSetting(
            user=self.user2,
            name='Unique Setting',
            url='https://unique.earthranger.com',
            token='unique_token',
            privacy='private'
        )
        new_setting.save()
        
        # Verify fetch task was called with the new setting's ID
        mock_fetch_task.assert_called_once_with([new_setting.pk])
