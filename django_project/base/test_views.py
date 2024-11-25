from unittest import mock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from base.models import Organisation, OrganisationInvitation, UserProfile
import json
from invitations.models import Invitation
from unittest.mock import patch

# Create your tests here.
class OrganisationViewsTests(TestCase):
    def setUp(self):
        # Create a user and login
        self.user = User.objects.create_user(username="testuser", email="manager@example.com", password="password")
        self.client.login(username="testuser", password="password")
        # Create some organisations
        self.org1 = Organisation.objects.create(name="Org1")
        self.org2 = Organisation.objects.create(name="Org2")

    def test_fetch_organisations(self):
        response = self.client.get(reverse('fetch_organization'))
        self.assertEqual(response.status_code, 200)
        organisations = response.json()
        self.assertEqual(organisations[0]["name"], "Org1")
        self.assertEqual(organisations[1]["name"], "Org2")



class JoinOrganisationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="user@example.com", password="password"
        )
        self.client.login(username="testuser", password="password")

        # Create an organisation
        self.org = Organisation.objects.create(name="Test Org")

        # Create an organisation manager (this user will be the one receiving the email)
        self.manager_user = User.objects.create_user(
            username="manager", email="manager@example.com", password="password"
        )
        # Link the manager to the organisation
        # Check if the UserProfile for the manager_user already exists
        user_profile, created = UserProfile.objects.get_or_create(
            user=self.manager_user
        )

        # If the profile is created, we assign the organisation manager role
        if created:
            user_profile.organisation = self.org
            user_profile.user_type = "organisation_manager"
            user_profile.save()
        else:
            # Update the existing profile to set the organisation and role
            user_profile.organisation = self.org
            user_profile.user_type = "organisation_manager"
            user_profile.save()

    @patch('django.core.mail.send_mail')
    def test_join_organisation_valid(self, mock_send_mail):
        # Simulate a valid join request
        response = self.client.post(reverse('join_organization'), json.dumps({
            "selectedOrganisationId": self.org.id
        }), content_type="application/json")
        
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Request sent successfully!")

    @patch('django.core.mail.send_mail')
    def test_join_organisation_invalid(self, mock_send_mail):
        response = self.client.post(
            reverse('join_organization'), 
            json.dumps({
                "selectedOrganisationId": 9999
            }), 
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)


class AddOrganisationTests(TestCase):
    def setUp(self):
        # Create a user and login
        self.user = User.objects.create_user(username="testuser", email="manager@example.com", password="password")
        self.client.login(username="testuser", password="password")

        self.superuser = User.objects.create_superuser(
            username="adminuser", 
            email="admin@example.com", 
            password="adminpassword"
        )

    @patch('django.core.mail.send_mail')
    def test_add_organisation(self, mock_send_mail):
        data = {
            "firstName": "John",
            "lastName": "Doe",
            "organisationName": "New Org",
            "organisationEmail": "contact@neworg.com",
            "industry": "Tech"
        }
        response = self.client.post(reverse('add_organization'), json.dumps(data), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Request sent successfully!")

