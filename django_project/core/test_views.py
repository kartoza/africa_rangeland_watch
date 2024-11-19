from django.test import TestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core import mail
from unittest.mock import patch
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings

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
