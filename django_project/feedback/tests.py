# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Feedback tests.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from unittest.mock import patch, MagicMock

from feedback.models import Feedback
from feedback.serializers import FeedbackSerializer
from feedback.factories import FeedbackF
from core.factories import UserF


class FeedbackModelTest(TestCase):
    """Test cases for Feedback model."""

    def setUp(self):
        self.user = UserF(
            username='testuser',
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com'
        )

    def test_feedback_str_method(self):
        """Test string representation of Feedback model."""
        feedback = FeedbackF(
            name='Test User',
            user=self.user
        )
        expected_str = (
            f"Feedback from {feedback.name} on "
            f"{feedback.created_at.strftime('%Y-%m-%d')}"
        )
        self.assertEqual(str(feedback), expected_str)

    def test_feedback_creation_with_fields(self):
        """Test feedback creation with all fields."""
        feedback = FeedbackF(
            user=self.user,
            name='Test User',
            email='test@example.com',
            message='This is a test feedback message.'
        )

        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.name, 'Test User')
        self.assertEqual(feedback.email, 'test@example.com')
        self.assertEqual(feedback.message, 'This is a test feedback message.')
        self.assertIsNotNone(feedback.created_at)
        self.assertFalse(feedback.read)

    @patch.object(EmailMultiAlternatives, 'send')
    def test_send_feedback_email_with_admin_users(self, mock_send):
        """Test sending feedback email when admin users exist."""
        # Create a superuser with email
        admin_user = UserF(
            username='admin',
            email='admin@example.com',
            is_superuser=True
        )

        feedback = FeedbackF(user=self.user)

        # Call send_feedback_email
        feedback.send_feedback_email()

        # Verify email.send() was called
        mock_send.assert_called_once()


class FeedbackSerializerTest(TestCase):
    """Test cases for FeedbackSerializer."""

    def setUp(self):
        self.user = UserF(
            username='testuser',
            email='test@example.com'
        )

    def test_feedback_serializer_valid_message(self):
        """Test serializer with valid message."""
        data = {
            'message': 'This is a valid feedback message.'
        }
        serializer = FeedbackSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_feedback_serializer_message_validation(self):
        """Test message validation rules."""
        # Test empty message
        data = {'message': ''}
        serializer = FeedbackSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)

        # Test message too short (< 3 characters)
        data = {'message': 'Hi'}
        serializer = FeedbackSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)

        # Test message too long (> 500 characters)
        data = {'message': 'x' * 501}
        serializer = FeedbackSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)


class FeedbackViewSetTest(APITestCase):
    """Test cases for FeedbackViewSet."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='testuser',
            password='testpassword',
            email='test@example.com',
            first_name='John',
            last_name='Doe'
        )
        self.client.login(username='testuser', password='testpassword')

    def test_create_feedback_authenticated_user(self):
        """Test creating feedback as authenticated user."""
        url = reverse('feedback:feedback-list')
        data = {
            'message': 'This is my feedback about the application.'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feedback.objects.count(), 1)

        feedback = Feedback.objects.first()
        self.assertEqual(feedback.user, self.user)
        self.assertEqual(feedback.name, 'John Doe')
        self.assertEqual(feedback.email, 'test@example.com')
        self.assertEqual(
            feedback.message,
            'This is my feedback about the application.'
        )
        self.assertIn('message', response.data)
        self.assertIn(
            'Thank you for your feedback',
            response.data['message']
        )

    def test_create_feedback_unauthenticated_user(self):
        """Test creating feedback as unauthenticated user."""
        self.client.logout()

        url = reverse('feedback:feedback-list')
        data = {
            'message': 'This is my feedback.'
        }

        response = self.client.post(url, data, format='json')

        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        )
        self.assertEqual(Feedback.objects.count(), 0)

    def test_list_feedback_user_sees_only_own(self):
        """Test that users can only see their own feedback."""
        # Create another user
        user2 = UserF(username='user2', email='user2@example.com')

        # Create feedback for both users
        feedback1 = FeedbackF(
            user=self.user,
            message='Feedback from user 1'
        )
        feedback2 = FeedbackF(
            user=user2,
            message='Feedback from user 2'
        )

        url = reverse('feedback:feedback-list')
        response = self.client.get(url, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Extract feedback IDs from response
        feedback_ids = [item['id'] for item in response.data['results']]

        # User should only see their own feedback
        self.assertIn(feedback1.id, feedback_ids)
        self.assertNotIn(feedback2.id, feedback_ids)
