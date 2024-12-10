from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from base.models import UserProfile
from rest_framework.exceptions import ErrorDetail
import os


class UserProfileViewsTestCase(APITestCase):
    def setUp(self):
        # Create a user for testing
        self.user = User.objects.create_user(
            username='testuser', email='testuser@example.com', password='password123'
        )
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)  # Log in as the test user

    def test_get_user_profile(self):
        """Test retrieving the user's profile"""
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['first_name'], self.user.first_name)
        self.assertEqual(response.data['last_name'], self.user.last_name)

    def test_get_user_profile_not_found(self):
        """Test that profile not found returns a 404"""
        # Delete profile
        self.profile.delete()
        response = self.client.get('/api/user/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_user_profile(self):
        """Test updating the user's profile"""
        data = {
            'first_name': 'UpdatedFirstName',
            'last_name': 'UpdatedLastName',
            'email': 'updatedemail@example.com'
        }
        response = self.client.patch('/api/profile/update/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'UpdatedFirstName')
        self.assertEqual(self.user.last_name, 'UpdatedLastName')
        self.assertEqual(self.user.email, 'updatedemail@example.com')

    def test_update_user_profile_profile_image(self):
        """Test updating the user's profile image"""
        # Get the current test directory path
        test_dir = os.path.dirname(__file__)  # Current directory where the test file is located
        file_path = os.path.join(test_dir, 'analytics_icon.svg')  # Full relative path to the file

        # Ensure the file exists before opening it
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"{file_path} does not exist")

        # Open the file and send it in the request
        with open(file_path, 'rb') as img:
            data = {'profile_image': img}
            response = self.client.patch('/api/profile/update/', data, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('profile_image' in response.data)

    def test_profile_image_upload(self):
        """Test uploading a profile image"""
        test_dir = os.path.dirname(__file__)  # Current directory where the test file is located
        file_path = os.path.join(test_dir, 'analytics_icon.svg')  # Full relative path to the file

        # Ensure the file exists before opening it
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"{file_path} does not exist")

        # Open the file and send it in the request
        with open(file_path, 'rb') as img:
            data = {'profile_image': img}
            response = self.client.put('/api/profile/image/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue('profile_image' in response.data)

    def test_profile_image_upload_invalid_file(self):
        """Test uploading an invalid file"""
        # Create an invalid file (e.g., a text file instead of an image)
        with open('invalid_file.txt', 'wb') as f:
            f.write(b"This is not a valid image file.")

        # Upload the invalid file using multipart form data
        with open('invalid_file.txt', 'rb') as f:
            data = {'profile_image': f}
            response = self.client.put('/api/profile/image/', data, format='multipart')

        # Assert that a 400 Bad Request is returned
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Invalid file type. Only image files are allowed.')
