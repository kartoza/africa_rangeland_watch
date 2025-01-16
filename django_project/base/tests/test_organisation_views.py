from unittest import mock
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from base.admin import approve_join_request, updateInvite
from rest_framework.test import APIClient
from base.models import Organisation, OrganisationInvitation, OrganisationInvitationDetail, UserOrganisations, UserProfile
import json
from invitations.models import Invitation
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from django.test import TestCase
from django.contrib.auth.models import User
from base.models import Organisation, UserProfile, UserOrganisations, OrganisationInvitationDetail
from django.contrib import messages



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




class JoinOrganisationTestCase(TestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="password"
        )
        self.user = User.objects.create_user(
            username="user",
            email="user@example.com",
            password="password"
        )
        self.organisation = Organisation.objects.create(name="Test Organisation")
        # Create UserProfile for each user
        self.org_manager_profile, _ = UserProfile.objects.get_or_create(user=self.manager)
        self.unrelated_user_profile, _ = UserProfile.objects.get_or_create(user=self.user)

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

        self.client.login(username="user", password="password")
        self.url = reverse("join_organization")

    def test_join_organisation_success(self):
        """Test a successful join organisation request."""
        data = {"selectedOrganisationId": self.organisation.id}
        response = self.client.post(self.url, json.dumps(data), content_type="application/json")

        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        self.assertEqual(response.json()["message"], "Request sent successfully!")

    def test_join_organisation_invalid_organisation(self):
        """Test with an invalid organisation ID."""
        data = {"selectedOrganisationId": 999}
        response = self.client.post(self.url, json.dumps(data), content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("message", response.json())
        self.assertEqual(response.json()["message"], "Invalid organisation ID.")

    def test_join_organisation_already_requested(self):
        """Test trying to join an organisation twice."""
        OrganisationInvitation.objects.create(email=self.user.email)
        OrganisationInvitationDetail.objects.create(
            invitation=OrganisationInvitation.objects.first(),
            organisation=self.organisation
        )

        data = {"selectedOrganisationId": self.organisation.id}
        response = self.client.post(self.url, json.dumps(data), content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("message", response.json())
        self.assertEqual(
            response.json()["message"], 
            "You have already requested to join this organisation."
        )




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



class AdminActionsTestCase(TestCase):
    def setUp(self):
        # Create necessary objects for testing
        self.user = User.objects.create_user(username="testuser", password="password")
        self.organisation = Organisation.objects.create(name="Test Organisation")
        self.invitation = OrganisationInvitation.objects.create(
            email="test@example.com", inviter=self.user, organisation=self.organisation
        )
        self.invitation_detail = OrganisationInvitationDetail.objects.create(
            invitation=self.invitation,
            organisation=self.organisation,
            request_type="add_organisation"
        )

    def test_update_invite_success(self):
        # Simulate the updateInvite function when invitation detail exists
        modeladmin = MagicMock()
        request = MagicMock()
        updateInvite(modeladmin, request, self.invitation)

        # Verify that the invitation detail's 'accepted' status is set to True
        self.invitation_detail.refresh_from_db()
        self.assertTrue(self.invitation_detail.accepted)

    def test_update_invite_not_found(self):
        # Simulate the updateInvite function when invitation detail doesn't exist
        modeladmin = MagicMock()
        request = MagicMock()

        # Delete the invitation detail to simulate a "not found" situation
        self.invitation_detail.delete()

        updateInvite(modeladmin, request, self.invitation)

        # Check that an error message is added
        modeladmin.message_user.assert_called_with(
            request, "OrganisationInvitationDetail not found for this request.", level="error"
        )


class AdminActionsTestCase(TestCase):
    def setUp(self):
        # Create necessary objects for testing
        self.user = User.objects.create_superuser(username="testuser", password="password")
        self.user_manager = User.objects.create_superuser(username="testuser_manager", password="password")
        self.organisation = Organisation.objects.create(name="Test Organisation")
        self.invitation = OrganisationInvitation.objects.create(
            email="test@example.com", inviter=self.user, organisation=self.organisation
        )
        self.invitation_manager = OrganisationInvitation.objects.create(
            email="test_manager@example.com", inviter=self.user_manager, organisation=self.organisation
        )
        self.invitation_detail = OrganisationInvitationDetail.objects.create(
            invitation=self.invitation,
            organisation=self.organisation,
            request_type="join_organisation"
        )
        self.invitation_detail_manager = OrganisationInvitationDetail.objects.create(
            invitation=self.invitation_manager,
            organisation=self.organisation,
            request_type="add_organisation"
        )
        self.metadata = json.dumps({
            "organisationName": "Test Organisation Test",
            "industry": "Technology"
        })
        self.invitation_detail_manager.metadata = self.metadata
        self.invitation_detail_manager.save()

    @patch("base.admin.EmailMultiAlternatives.send")
    def test_approve_join_request_add_organisation(self, mock_send):
        # Simulate the approve_join_request function for add_organisation requests
        modeladmin = MagicMock()
        request = MagicMock()
        queryset = OrganisationInvitation.objects.filter(id=self.invitation_manager.id)

        approve_join_request(modeladmin, request, queryset)

        user_profile = UserProfile.objects.get(user=self.user_manager)
        user_org = UserOrganisations.objects.get(user_profile=user_profile)
        self.assertEqual(user_org.user_type, 'manager')

        # Check if the email was sent
        mock_send.assert_called_once()

    @patch("base.admin.EmailMultiAlternatives.send")
    def test_approve_join_request_no_superuser(self, mock_send):
        # Remove the superuser to simulate the error case
        User.objects.filter(is_superuser=True).delete()

        modeladmin = MagicMock()
        request = MagicMock()
        queryset = OrganisationInvitation.objects.filter(id=self.invitation.id)

        approve_join_request(modeladmin, request, queryset)

        # Check that an error message is shown
        modeladmin.message_user.assert_called_with(
            request, "No admin user found to process the request.", level=messages.ERROR
        )
