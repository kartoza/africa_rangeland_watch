from django.test import TestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core import mail
from unittest.mock import patch
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from rest_framework.test import APIClient


class CustomRegistrationViewTest(TestCase):
    def setUp(self):
        self.registration_url = reverse('registration')
        self.email = 'testuser@example.com'
        self.password = 'password123'

    def test_registration_success(self):
        data = {
            'email': self.email,
            'password1': self.password,
        }
        
        response = self.client.post(self.registration_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'verification email sent.')

    def test_registration_email_already_exists(self):
        get_user_model().objects.create_user(email=self.email, password=self.password, username=self.email)
        data = {
            'email': self.email,
            'password1': self.password,
            'password2': self.password,
        }
        response = self.client.post(self.registration_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Email is already registered.', response.data['email'])


class AccountActivationViewTest(TestCase):
    def setUp(self):
        self.email = 'testuser@example.com'
        self.password = 'password123'
        self.user = get_user_model().objects.create_user(email=self.email, password=self.password, username=self.email)
        self.user.is_active = False
        self.user.save()

    def test_activation_success(self):
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(str(self.user.pk).encode())

        activation_url = reverse('account-activation', kwargs={'uidb64': uid, 'token': token})
        
        response = self.client.get(activation_url)
        
        self.assertRedirects(response, f"{settings.DJANGO_BACKEND_URL}/#/?registration_complete=true")
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_activation_invalid_token(self):
        invalid_token = 'invalid-token'
        uid = urlsafe_base64_encode(str(self.user.pk).encode())

        activation_url = reverse('account-activation', kwargs={'uidb64': uid, 'token': invalid_token})
        
        response = self.client.get(activation_url)
        
        response_data = response.json()

        self.assertIn('Invalid activation link', response_data['error'])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ForgotPasswordViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email="testuser@example.com", password="password123",
            username="estuser@example.com"
        )
        self.url = reverse("password-reset")

    def test_forgot_password_success(self):
        """Test that the password reset link is sent successfully."""
        data = {"email": "testuser@example.com"}

        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password reset link sent to your email.")

    def test_forgot_password_email_not_found(self):
        """Test that the forgot password returns an error if the email is not found."""
        data = {"email": "nonexistentuser@example.com"}

        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Email not found")


class ResetPasswordConfirmViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email="testuser@example.com", password="password123",
            username="testuser@example.com"
        )
        self.reset_password_url = self._generate_reset_password_url()

    def _generate_reset_password_url(self):
        """Helper method to generate a reset password URL."""
        uid = urlsafe_base64_encode(str(self.user.pk).encode())
        token = default_token_generator.make_token(self.user)
        return reverse("password-reset-confirm", args=[uid, token])

    def test_reset_password_success(self):
        """Test that the password reset process works correctly."""
        data = {"new_password": "newpassword123"}

        response = self.client.post(self.reset_password_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Password has been successfully reset.")

        # Ensure that the password is actually reset
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_reset_password_invalid_token(self):
        """Test that the reset password link with invalid token returns an error."""
        # Create an invalid token for testing
        invalid_token = "invalidtoken"
        uid = urlsafe_base64_encode(str(self.user.pk).encode())
        url = reverse("password-reset-confirm", args=[uid, invalid_token])

        data = {"new_password": "newpassword123"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid reset link")

    def test_reset_password_invalid_uid(self):
        """Test that the reset password link with invalid UID returns an error."""
        # Create an invalid UID for testing
        invalid_uid = "invaliduid"
        token = default_token_generator.make_token(self.user)
        url = reverse("password-reset-confirm", args=[invalid_uid, token])

        data = {"new_password": "newpassword123"}

        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Invalid reset link")
