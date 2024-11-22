from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from base.models import Organisation, OrganisationInvitation, UserProfile
import json
from invitations.models import Invitation

class OrganisationViewsTestCase(TestCase):
    def setUp(self):
        # Create users
        self.org_manager = User.objects.create_user(
            username="org_manager", email="manager@example.com", password="password"
        )
        self.member = User.objects.create_user(
            username="member", email="member@example.com", password="password"
        )
        self.unrelated_user = User.objects.create_user(
            username="unrelated", email="unrelated@example.com", password="password"
        )

        self.org_manager_profile = UserProfile.objects.get(user=self.org_manager)
        self.org_manager_profile.user_type = "organisation_manager"
        self.org_manager_profile.save()

        self.member_profile = UserProfile.objects.get(user=self.member)
        self.member_profile.user_type = "organisation_member"
        self.member_profile.save()

        # Create organisation
        self.organisation = Organisation.objects.create(name="Test Organisation")

        self.org_manager_profile.organisation = self.organisation 
        self.org_manager_profile.save()

        self.member_profile.organisation = self.organisation 
        self.member_profile.save()

        # APIClient for testing
        self.client = APIClient()

    def test_delete_organisation_member_success(self):
        self.client.login(username="org_manager", password="password")

        url = reverse("delete_member")
        response = self.client.delete(
            url,
            data=json.dumps({"organisation_id": self.organisation.id, "user_email": "member@example.com"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Member removed successfully."})

        self.member_profile.refresh_from_db()
        self.assertIsNone(self.member_profile.organisation)

    def test_delete_organisation_member_invalid_method(self):
        self.client.login(username="org_manager", password="password")

        url = reverse("delete_member")
        response = self.client.post(
            url,
            data={"organisation_id": self.organisation.id, "user_email": "member@example.com"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"error": "Invalid HTTP method. Use DELETE."})

    def test_delete_organisation_member_missing_params(self):
        self.client.login(username="org_manager", password="password")

        url = reverse("delete_member")
        response = self.client.delete(
            url,
            data=json.dumps({"organisation_id": self.organisation.id}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "Organisation ID and User Email are required."})

    def test_delete_organisation_member_not_manager(self):
        self.client.login(username="member", password="password")

        url = reverse("delete_member")
        response = self.client.delete(
            url,
            data=json.dumps({"organisation_id": self.organisation.id, "user_email": "member@example.com"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json(), {"error": "You don't have permission to remove members."})

    def test_fetch_organisation_data_success(self):
        self.client.login(username="org_manager", password="password")

        url = reverse("fetch_organisation_data")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("Test Organisation", response.json())

    def test_fetch_organisation_data_no_membership(self):
        self.client.login(username="unrelated", password="password")

        url = reverse("fetch_organisation_data")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json(), {"error": "User is not part of any organizations."})




class InviteToOrganisationTestCase(TestCase):
    def setUp(self):
        # Create users
        self.org_manager = User.objects.create_user(
            username="org_manager", email="manager@example.com", password="password"
        )
        self.unrelated_user = User.objects.create_user(
            username="unrelated_user", email="unrelated@example.com", password="password"
        )

        # Create organisation
        self.organisation = Organisation.objects.create(name="Test Organisation")

        # attach user to org and make manager
        self.org_manager_profile = UserProfile.objects.get(user=self.org_manager)
        self.org_manager_profile.user_type = "organisation_manager"
        self.org_manager_profile.organisation = self.organisation 
        self.org_manager_profile.save()

        self.client.login(username="org_manager", password="password")

        self.url = reverse("invite_to_organisation", args=[self.organisation.id])

    def test_invite_success(self):
        """Test successful invitation."""
        data = {"email": "new_user@example.com", "message": "Welcome to the team!"}
        response = self.client.post(self.url, data=json.dumps(data), content_type="application/json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True})

        # Verify that an invitation was created
        invitation = OrganisationInvitation.objects.filter(email="new_user@example.com").first()
        self.assertIsNotNone(invitation)
        self.assertEqual(invitation.organisation, self.organisation)


    def test_invite_invalid_form(self):
        """Test invitation with invalid email."""
        data = {"email": "invalid-email"} 
        response = self.client.post(self.url, data=data, content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())
        self.assertIn("email", response.json()["details"])


    def test_invite_invalid_http_method(self):
        """Test handling of invalid HTTP methods."""
        response = self.client.get(self.url)  # Sending GET request instead of POST

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"error": "Invalid HTTP method. Use POST."})


    def test_invite_unrelated_user(self):
        """Test invitation by an unrelated user."""
        self.client.logout()
        self.client.login(username="unrelated_user", password="password")

        data = {"email": "new_user@example.com"}
        response = self.client.post(self.url, data=data, content_type="application/json")

        self.assertEqual(response.status_code, 403)  # Access denied
