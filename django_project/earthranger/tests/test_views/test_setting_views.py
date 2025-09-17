import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, Mock
from earthranger.models import EarthRangerSetting, EarthRangerEvents
from core.factories import UserF
from earthranger.factories import (
    EarthRangerSettingFactory, 
    PublicEarthRangerSettingFactory,
    PrivateEarthRangerSettingFactory,
    InactiveEarthRangerSettingFactory,
    EarthRangerEventsFactory
)


class EarthRangerSettingListCreateViewTest(APITestCase):
    """Test cases for EarthRangerSettingListCreateView."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user1 = UserF(username="testuser1")
        self.user2 = UserF(username="testuser2")
        
        # Create settings for user1
        self.public_setting1 = PublicEarthRangerSettingFactory(
            user=self.user1,
            name="Public Setting 1",
            url="https://api1.earthranger.com"
        )
        self.private_setting1 = PrivateEarthRangerSettingFactory(
            user=self.user1,
            name="Private Setting 1",
            url="https://api2.earthranger.com"
        )
        self.inactive_setting1 = InactiveEarthRangerSettingFactory(
            user=self.user1,
            name="Inactive Setting 1",
            privacy="public"
        )
        
        # Create settings for user2
        self.public_setting2 = PublicEarthRangerSettingFactory(
            user=self.user2,
            name="Public Setting 2"
        )
        self.private_setting2 = PrivateEarthRangerSettingFactory(
            user=self.user2,
            name="Private Setting 2"
        )
        
        self.list_url = reverse('earthranger:setting-list-create')  # Adjust URL name as needed
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access the endpoint."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authenticated_user_can_list_own_settings(self):
        """Test that authenticated users can only see their own settings."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        
        # Should see 3 settings (public, private, inactive) for user1
        results = response.data['results']
        self.assertEqual(len(results), 3)
        
        # Verify all returned settings belong to user1
        setting_names = [setting['name'] for setting in results]
        self.assertIn("Public Setting 1", setting_names)
        self.assertIn("Private Setting 1", setting_names)
        self.assertIn("Inactive Setting 1", setting_names)
        
        # Should not see user2's settings
        self.assertNotIn("Public Setting 2", setting_names)
        self.assertNotIn("Private Setting 2", setting_names)
    
    def test_settings_ordered_by_updated_at_desc(self):
        """Test that settings are ordered by updated_at in descending order."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        
        # Check that results are ordered by updated_at (most recent first)
        updated_times = [setting['updated_at'] for setting in results]
        self.assertEqual(updated_times, sorted(updated_times, reverse=True))
    
    def test_search_functionality(self):
        """Test search functionality by name and URL."""
        self.client.force_authenticate(user=self.user1)
        
        # Search by name
        response = self.client.get(self.list_url, {'search': 'Public'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], "Public Setting 1")
        
        # Search by URL
        response = self.client.get(self.list_url, {'search': 'api1.earthranger'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], "Public Setting 1")
        
        # Search with no matches
        response = self.client.get(self.list_url, {'search': 'nonexistent'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 0)
    
    def test_privacy_filter(self):
        """Test filtering by privacy type."""
        self.client.force_authenticate(user=self.user1)
        
        # Filter by public
        response = self.client.get(self.list_url, {'privacy': 'public'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['privacy'], 'public')
        
        # Filter by private
        response = self.client.get(self.list_url, {'privacy': 'private'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['privacy'], 'private')
    
    def test_is_active_filter(self):
        """Test filtering by active status."""
        self.client.force_authenticate(user=self.user1)
        
        # Filter by active
        response = self.client.get(self.list_url, {'is_active': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 2)  # public and private settings are active
        
        # Filter by inactive
        response = self.client.get(self.list_url, {'is_active': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]['is_active'])
    
    def test_combined_filters(self):
        """Test combining multiple filters."""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(self.list_url, {
            'privacy': 'public',
            'is_active': 'true',
            'search': 'Public'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], "Public Setting 1")
    
    def test_pagination(self):
        """Test pagination functionality."""
        # Create more settings to test pagination
        EarthRangerSettingFactory.create_batch(15, user=self.user1)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)
        
        # Default page size is 10
        self.assertEqual(len(response.data['results']), 10)
        self.assertEqual(response.data['count'], 18)  # 15 + 3 from setUp
    
    def test_custom_page_size(self):
        """Test custom page size parameter."""
        EarthRangerSettingFactory.create_batch(5, user=self.user1)
        
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_url, {'page_size': 5})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 5)
    
    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_create_setting_success(self, mock_check_token, mock_fetch_task):
        """Test successful creation of a new setting."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'New Test Setting',
            'url': 'https://new.earthranger.com',
            'token': 'new-test-token',
            'privacy': 'public',
            'is_active': True
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Test Setting')
        self.assertEqual(response.data['url'], 'https://new.earthranger.com')
        self.assertEqual(response.data['privacy'], 'public')
        
        # Verify setting was created in database
        setting = EarthRangerSetting.objects.get(name='New Test Setting')
        self.assertEqual(setting.user, self.user1)
        self.assertTrue(setting.is_active)
    
    def test_create_setting_duplicate_name(self):
        """Test creation fails with duplicate name."""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'Public Setting 1',  # Already exists
            'url': 'https://duplicate.earthranger.com',
            'token': 'duplicate-token',
            'privacy': 'public'
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
    
    def test_create_setting_invalid_data(self):
        """Test creation fails with invalid data."""
        self.client.force_authenticate(user=self.user1)
        
        # Missing required fields
        data = {
            'name': 'Incomplete Setting'
            # Missing url, token
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('url', response.data)
        self.assertIn('token', response.data)
    
    def test_create_setting_invalid_url(self):
        """Test creation fails with invalid URL."""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'Invalid URL Setting',
            'url': 'not-a-valid-url',
            'token': 'test-token',
            'privacy': 'public'
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('url', response.data)


class EarthRangerSettingDetailViewTest(APITestCase):
    """Test cases for EarthRangerSettingDetailView."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user1 = UserF(username="testuser1")
        self.user2 = UserF(username="testuser2")
        
        self.setting1 = EarthRangerSettingFactory(
            user=self.user1,
            name="Test Setting 1",
            url="https://api.earthranger.com",
            token="test-token-1"
        )
        self.setting2 = EarthRangerSettingFactory(
            user=self.user2,
            name="Test Setting 2"
        )
        
        self.detail_url1 = reverse('earthranger:settings-detail', kwargs={'pk': self.setting1.pk})
        self.detail_url2 = reverse('earthranger:settings-detail', kwargs={'pk': self.setting2.pk})
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access the endpoint."""
        response = self.client.get(self.detail_url1)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_own_setting(self):
        """Test that users can retrieve their own settings."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.detail_url1)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.setting1.id)
        self.assertEqual(response.data['name'], "Test Setting 1")
        self.assertEqual(response.data['url'], "https://api.earthranger.com")
    
    def test_cannot_retrieve_other_users_setting(self):
        """Test that users cannot retrieve other users' settings."""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.detail_url2)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_retrieve_nonexistent_setting(self):
        """Test retrieving a nonexistent setting."""
        self.client.force_authenticate(user=self.user1)
        nonexistent_url = reverse('earthranger:settings-detail', kwargs={'pk': 99999})
        response = self.client.get(nonexistent_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_update_own_setting(self, mock_check_token):
        """Test that users can update their own settings."""
        self.client.force_authenticate(user=self.user1)
        mock_check_token.return_value = True
        
        data = {
            'name': 'Updated Test Setting',
            'url': 'https://updated.earthranger.com',
            'token': 'updated-token',
            'privacy': 'private',
            'is_active': False
        }
        
        response = self.client.put(self.detail_url1, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Test Setting')
        self.assertEqual(response.data['url'], 'https://updated.earthranger.com')
        self.assertEqual(response.data['privacy'], 'private')
        self.assertFalse(response.data['is_active'])
        
        # Verify changes in database
        self.setting1.refresh_from_db()
        self.assertEqual(self.setting1.name, 'Updated Test Setting')
        self.assertEqual(self.setting1.user, self.user1)  # User should remain the same
    
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_partial_update_own_setting(self, mock_check_token):
        """Test partial update (PATCH) of own setting."""
        self.client.force_authenticate(user=self.user1)
        mock_check_token.return_value = True
        
        data = {
            'name': 'Partially Updated Setting',
            'is_active': False
        }
        
        response = self.client.patch(self.detail_url1, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Partially Updated Setting')
        self.assertFalse(response.data['is_active'])
        
        # Other fields should remain unchanged
        self.assertEqual(response.data['url'], "https://api.earthranger.com")
        self.assertEqual(response.data['token'], "test-token-1")
    
    def test_cannot_update_other_users_setting(self):
        """Test that users cannot update other users' settings."""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'Unauthorized Update',
            'url': 'https://unauthorized.earthranger.com'
        }
        
        response = self.client.put(self.detail_url2, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_with_duplicate_name(self):
        """Test update fails with duplicate name."""
        # Create another setting for user1
        other_setting = EarthRangerSettingFactory(
            user=self.user1,
            name="Other Setting"
        )
        
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'Other Setting',  # Duplicate name
            'url': 'https://duplicate.earthranger.com',
            'token': 'duplicate-token',
            'privacy': 'public'
        }
        
        response = self.client.put(self.detail_url1, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
    
    def test_update_with_invalid_data(self):
        """Test update fails with invalid data."""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': '',  # Empty name
            'url': 'not-a-valid-url',  # Invalid URL
            'token': 'test-token'
        }
        
        response = self.client.put(self.detail_url1, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('url', response.data)
    
    def test_delete_own_setting(self):
        """Test that users can delete their own settings."""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.delete(self.detail_url1)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify setting was deleted
        self.assertFalse(
            EarthRangerSetting.objects.filter(pk=self.setting1.pk).exists()
        )
    
    def test_cannot_delete_other_users_setting(self):
        """Test that users cannot delete other users' settings."""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.delete(self.detail_url2)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify setting was not deleted
        self.assertTrue(
            EarthRangerSetting.objects.filter(pk=self.setting2.pk).exists()
        )
    
    def test_delete_setting_with_associated_events(self):
        """Test deleting a setting that has associated events."""
        # Create events associated with the setting
        event1 = EarthRangerEventsFactory()
        event1.earth_ranger_settings.add(self.setting1)
        
        event2 = EarthRangerEventsFactory()
        event2.earth_ranger_settings.add(self.setting1)
        
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.delete(self.detail_url1)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify setting was deleted
        self.assertFalse(
            EarthRangerSetting.objects.filter(pk=self.setting1.pk).exists()
        )
        
        # Verify events still exist (many-to-many relationship)
        self.assertTrue(
            EarthRangerEvents.objects.filter(pk=event1.pk).exists()
        )
        self.assertTrue(
            EarthRangerEvents.objects.filter(pk=event2.pk).exists()
        )


class EarthRangerSettingPaginationTest(APITestCase):
    """Test cases for EarthRangerSettingPagination."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserF()
        self.list_url = reverse('earthranger:setting-list-create')
        
        # Create 25 settings to test pagination
        EarthRangerSettingFactory.create_batch(25, user=self.user)
    
    def test_default_page_size(self):
        """Test default page size is 10."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        self.assertEqual(response.data['count'], 25)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])
    
    def test_custom_page_size(self):
        """Test custom page size parameter."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url, {'page_size': 15})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 15)
        self.assertEqual(response.data['count'], 25)
    
    def test_max_page_size_limit(self):
        """Test that page size is limited to max_page_size."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url, {'page_size': 200})  # Exceeds max of 100
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 25)  # All results since 25 < 100
    
    def test_pagination_navigation(self):
        """Test pagination navigation links."""
        self.client.force_authenticate(user=self.user)
        
        # First page
        response = self.client.get(self.list_url, {'page': 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['previous'])
        self.assertIsNotNone(response.data['next'])
        
        # Second page
        response = self.client.get(self.list_url, {'page': 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['previous'])
        self.assertIsNotNone(response.data['next'])
        
        # Last page
        response = self.client.get(self.list_url, {'page': 3})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['previous'])
        self.assertIsNone(response.data['next'])
        self.assertEqual(len(response.data['results']), 5)  # Remaining items


class EarthRangerSettingIntegrationTest(APITestCase):
    """Integration tests for EarthRanger settings functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserF()
        self.list_url = reverse('earthranger:setting-list-create')
    
    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_create_and_retrieve_setting_workflow(self, mock_check_token, mock_fetch_task):
        """Test complete workflow of creating and retrieving a setting."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user)
        
        # Create setting
        create_data = {
            'name': 'Integration Test Setting',
            'url': 'https://integration.earthranger.com',
            'token': 'integration-test-token',
            'privacy': 'public',
            'is_active': True
        }
        
        create_response = self.client.post(self.list_url, create_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        
        setting_id = create_response.data['id']
        
        # Retrieve the created setting
        detail_url = reverse('earthranger:settings-detail', kwargs={'pk': setting_id})
        retrieve_response = self.client.get(detail_url)
        
        self.assertEqual(retrieve_response.status_code, status.HTTP_200_OK)
        self.assertEqual(retrieve_response.data['name'], 'Integration Test Setting')
        self.assertEqual(retrieve_response.data['url'], 'https://integration.earthranger.com')
        
        # Verify it appears in the list
        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['results']), 1)
        self.assertEqual(list_response.data['results'][0]['name'], 'Integration Test Setting')
    
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_update_and_filter_workflow(self, mock_check_token):
        """Test workflow of updating a setting and filtering results."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user)
        
        # Create initial setting
        setting = EarthRangerSettingFactory(
            user=self.user,
            name="Workflow Test Setting",
            privacy="public",
            is_active=True
        )
        
        detail_url = reverse('earthranger:settings-detail', kwargs={'pk': setting.pk})
        
        # Update setting to private and inactive
        update_data = {
            'name': 'Updated Workflow Setting',
            'url': setting.url,
            'token': setting.token,
            'privacy': 'private',
            'is_active': False
        }
        
        update_response = self.client.put(detail_url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # Filter by private settings
        filter_response = self.client.get(self.list_url, {'privacy_type': 'private'})
        self.assertEqual(filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filter_response.data['results']), 1)
        self.assertEqual(filter_response.data['results'][0]['name'], 'Updated Workflow Setting')
        
        # Filter by inactive settings
        filter_response = self.client.get(self.list_url, {'is_active': 'false'})
        self.assertEqual(filter_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filter_response.data['results']), 1)
        self.assertFalse(filter_response.data['results'][0]['is_active'])
    
    def test_search_across_multiple_fields(self):
        """Test search functionality across name and URL fields."""
        self.client.force_authenticate(user=self.user)
        
        # Create settings with different names and URLs
        EarthRangerSettingFactory(
            user=self.user,
            name="Wildlife Monitoring",
            url="https://wildlife.earthranger.com"
        )
        EarthRangerSettingFactory(
            user=self.user,
            name="Security Patrol",
            url="https://security.earthranger.com"
        )
        EarthRangerSettingFactory(
            user=self.user,
            name="Research Data",
            url="https://research.example.com"
        )
        
        # Search by name
        response = self.client.get(self.list_url, {'search': 'Wildlife'})
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Wildlife Monitoring')
        
        # Search by URL domain
        response = self.client.get(self.list_url, {'search': 'earthranger'})
        self.assertEqual(len(response.data['results']), 2)
        
        # Search by partial URL
        response = self.client.get(self.list_url, {'search': 'security'})
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Security Patrol')
    
    def test_error_handling_and_validation(self):
        """Test various error conditions and validation."""
        self.client.force_authenticate(user=self.user)
        
        # Test creating setting with missing required fields
        invalid_data = {'name': 'Incomplete Setting'}
        response = self.client.post(self.list_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('url', response.data)
        self.assertIn('token', response.data)
        
        # Test creating setting with invalid URL
        invalid_data = {
            'name': 'Invalid URL Setting',
            'url': 'not-a-url',
            'token': 'test-token'
        }
        response = self.client.post(self.list_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('url', response.data)
        
        # Test creating setting with invalid privacy choice
        invalid_data = {
            'name': 'Invalid Privacy Setting',
            'url': 'https://valid.earthranger.com',
            'token': 'test-token',
            'privacy': 'invalid_choice'
        }
        response = self.client.post(self.list_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('privacy', response.data)


class EarthRangerSettingPermissionTest(APITestCase):
    """Test permission-related functionality for EarthRanger settings."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user1 = UserF(username="user1")
        self.user2 = UserF(username="user2")
        self.admin_user = UserF(username="admin", is_staff=True, is_superuser=True)
        
        self.user1_setting = EarthRangerSettingFactory(user=self.user1)
        self.user2_setting = EarthRangerSettingFactory(user=self.user2)
        
        self.list_url = reverse('earthranger:setting-list-create')
        self.user1_detail_url = reverse('earthranger:settings-detail', kwargs={'pk': self.user1_setting.pk})
        self.user2_detail_url = reverse('earthranger:settings-detail', kwargs={'pk': self.user2_setting.pk})
    
    def test_user_isolation(self):
        """Test that users can only access their own settings."""
        # User1 should only see their own settings
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.user1_setting.id)
        
        # User2 should only see their own settings
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.user2_setting.id)
    
    def test_cross_user_access_denied(self):
        """Test that users cannot access other users' settings."""
        self.client.force_authenticate(user=self.user1)
        
        # User1 cannot retrieve User2's setting
        response = self.client.get(self.user2_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # User1 cannot update User2's setting
        update_data = {'name': 'Unauthorized Update'}
        response = self.client.patch(self.user2_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # User1 cannot delete User2's setting
        response = self.client.delete(self.user2_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_admin_user_restrictions(self):
        """Test that even admin users follow the same permission rules."""
        # Note: Based on the view implementation, even admin users only see their own settings
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)  # Admin has no settings
        
        # Admin cannot access other users' settings
        response = self.client.get(self.user1_detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_user_ownership_preserved_on_update(self, mock_check_token):
        """Test that user ownership is preserved during updates."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user1)
        
        update_data = {
            'name': 'Updated Setting Name',
            'url': self.user1_setting.url,
            'token': self.user1_setting.token,
            'privacy': 'private'
        }
        
        response = self.client.put(self.user1_detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify ownership is preserved
        self.user1_setting.refresh_from_db()
        self.assertEqual(self.user1_setting.user, self.user1)
        self.assertEqual(self.user1_setting.name, 'Updated Setting Name')


class EarthRangerSettingModelIntegrationTest(APITestCase):
    """Test integration between views and model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserF()
        self.list_url = reverse('earthranger:setting-list-create')
    
    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_setting_creation_triggers_model_save(self, mock_check_token, mock_fetch_task):
        """Test that creating a setting thrugh API triggers model save logic."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user)
        
        # Create existing events with same URL and token
        existing_setting = EarthRangerSettingFactory(
            url="https://test.earthranger.com",
            token="test-token-123"
        )
        existing_event = EarthRangerEventsFactory()
        existing_event.earth_ranger_settings.add(existing_setting)
        
        # Create new setting with same URL and token
        create_data = {
            'name': 'New Setting Same Credentials',
            'url': 'https://test.earthranger.com',
            'token': 'test-token-123',
            'privacy': 'public'
        }
        
        response = self.client.post(self.list_url, create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the new setting was associated with existing events
        new_setting = EarthRangerSetting.objects.get(name='New Setting Same Credentials')
        self.assertTrue(existing_event.earth_ranger_settings.filter(pk=new_setting.pk).exists())
    
    @patch('earthranger.tasks.fetch_earth_ranger_events.delay')
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_setting_creation_triggers_fetch_when_no_existing_events(self, mock_check_token, mock_fetch_task):
        """Test that creating a setting triggers event fetch when no existing events."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user)
        
        create_data = {
            'name': 'New Setting No Events',
            'url': 'https://new.earthranger.com',
            'token': 'new-token-456',
            'privacy': 'public'
        }
        
        response = self.client.post(self.list_url, create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify fetch task was called
        new_setting = EarthRangerSetting.objects.get(name='New Setting No Events')
        mock_fetch_task.assert_called_once_with([new_setting.pk])
    
    @patch('earthranger.serializers.EarthRangerSettingSerializer._check_token')
    def test_setting_str_representation(self, mock_check_token):
        """Test that setting string representation works correctly."""
        mock_check_token.return_value = True
        self.client.force_authenticate(user=self.user)
        
        create_data = {
            'name': 'String Representation Test',
            'url': 'https://string.earthranger.com',
            'token': 'string-token',
            'privacy': 'public'
        }
        
        response = self.client.post(self.list_url, create_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        setting = EarthRangerSetting.objects.get(name='String Representation Test')
        self.assertEqual(str(setting), 'String Representation Test')
