from unittest import mock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from base.models import Organisation, OrganisationInvitation, UserOrganisations, UserProfile
import json
from invitations.models import Invitation
from unittest.mock import patch


from rest_framework.test import APIClient
from django.test import TestCase
from django.contrib.auth.models import User
from base.models import Organisation, UserProfile, UserOrganisations

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
        self.no_org_user = User.objects.create_user(
            username="no_org_user", email="no_org_user@example.com", password="password"
        )

        # Create organisation
        self.organisation = Organisation.objects.create(name="Test Organisation")
        self.organisation_dummy = Organisation.objects.create(name="Test Organisation 2")

        # Create UserProfile for each user
        self.org_manager_profile, _ = UserProfile.objects.get_or_create(user=self.org_manager)
        self.member_profile, _ = UserProfile.objects.get_or_create(user=self.member)
        self.unrelated_user_profile, _ = UserProfile.objects.get_or_create(user=self.unrelated_user)

        # Create UserOrganisations relationships using user_profile
        self.org_manager_relation = UserOrganisations.objects.create(
            user_profile=self.org_manager_profile,
            organisation=self.organisation,
            user_type="manager"
        )

        self.member_relation = UserOrganisations.objects.create(
            user_profile=self.member_profile,
            organisation=self.organisation,
            user_type="member"  # setting this user as member
        )

        self.unrelated_user_relation = UserOrganisations.objects.create(
            user_profile=self.unrelated_user_profile,
            organisation=self.organisation_dummy,
            user_type="member"
        )

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

        # Ensure the UserOrganisations relation is deleted
        self.assertFalse(UserOrganisations.objects.filter(user_profile=self.member_profile, organisation=self.organisation).exists())

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

    def test_delete_organisation_member_user_not_in_org(self):
        self.client.login(username="org_manager", password="password")

        url = reverse("delete_member")
        response = self.client.delete(
            url,
            data=json.dumps({"organisation_id": self.organisation.id, "user_email": "unrelated@example.com"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"error": "User is not a member of this organisation."})

    def test_fetch_organisation_data_success(self):
        self.client.login(username="org_manager", password="password")

        url = reverse("fetch_organisation_data")
        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertIn("Test Organisation", response.json())

    def test_fetch_organisation_data_unauthenticated(self):

        url = reverse("fetch_organisation_data")
        response = self.client.get(url)

        # it attempts redirect to login
        self.assertEqual(response.status_code, 302)

    def test_fetch_organisation_data_no_membership(self):
        self.client.login(username="no_org_user", password="password")

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

        # Create UserProfile for each user
        self.org_manager_profile, _ = UserProfile.objects.get_or_create(user=self.org_manager)
        self.unrelated_user_profile, _ = UserProfile.objects.get_or_create(user=self.unrelated_user)

        # Attach user to org and make manager using UserOrganisations model
        self.user_org_relation = UserOrganisations.objects.create(
            user_profile=self.org_manager_profile,
            organisation=self.organisation,
            user_type="manager"  # setting this user as manager
        )

        self.unrelated_user_org_relation = UserOrganisations.objects.create(
            user_profile=self.unrelated_user_profile,
            organisation=self.organisation,
            user_type="member"  # unrelated user is not a manager
        )

        # Client setup and login
        self.client.login(username="org_manager", password="password")

        # URL for inviting user to organisation
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
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"error": "Invalid HTTP method. Use POST."})


    def test_invite_unrelated_user(self):
        """Test invitation by an unrelated user."""
        self.client.logout()
        self.client.login(username="unrelated_user", password="password")

        data = {"email": "new_user@example.com"}
        response = self.client.post(self.url, data=data, content_type="application/json")

        self.assertEqual(response.status_code, 403)




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
        # Create test user and log in
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

        user_profile, created = UserProfile.objects.get_or_create(user=self.manager_user)


        self.manager_relation, created = UserOrganisations.objects.get_or_create(
            user_profile=user_profile,
            organisation=self.org,
        )

        if created:
            self.manager_relation.user_type = "manager"
            self.manager_relation.save()


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
