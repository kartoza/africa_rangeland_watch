from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User, Group
from base.models import Organisation, UserProfile
from analysis.models import UserAnalysisResults
from dashboard.models import Dashboard
from django.urls import reverse


class DashboardAPITest(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username="testuser", password="password")
        self.other_user = User.objects.create_user(username="otheruser", password="password")

        # Create a group
        self.group = Group.objects.create(name="Test Group")
        self.group.user_set.add(self.other_user)

        # Create organisations
        self.org1 = Organisation.objects.create(name="Org1")
        self.org2 = Organisation.objects.create(name="Org2")

        # Create analysis results
        self.analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user, 
            analysis_results={"key": "value"}
        )

        # Authenticate user
        self.client.force_authenticate(user=self.user)
        self.create_url = reverse("dashboard-create")
        self.share_url = lambda pk: reverse("dashboard-share", kwargs={"pk": pk})
        self.list_url = reverse("dashboard-list-create")

    def test_create_dashboard_without_authentication(self):
        """Test that unauthenticated users cannot create dashboards."""
        self.client.logout()
        payload = {"title": "Unauthorized Dashboard"}
        response = self.client.post(self.create_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_dashboard_invalid_organisation_name(self):
        """Test creating a dashboard with an invalid organisation name."""
        payload = {
            "title": "Invalid Org Dashboard",
            "privacy_type": "organisation",
            "organisations": ["InvalidOrg"],
        }
        response = self.client.post(self.create_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Organisation 'InvalidOrg' does not exist.", response.data.get("message"))

    def test_share_dashboard_with_users(self):
        """Test sharing a dashboard with specific users."""
        dashboard = Dashboard.objects.create(title="Share Test", created_by=self.user)
        payload = {"users": [self.other_user.id]}
        response = self.client.post(self.share_url(dashboard.pk), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.other_user, dashboard.users.all())

    def test_share_dashboard_with_groups(self):
        """Test sharing a dashboard with specific groups."""
        dashboard = Dashboard.objects.create(title="Group Share Test", created_by=self.user)
        payload = {"groups": [self.group.id]}
        response = self.client.post(self.share_url(dashboard.pk), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.group, dashboard.groups.all())

    def test_share_dashboard_by_non_creator(self):
        """Test that non-creators cannot share a dashboard."""
        dashboard = Dashboard.objects.create(title="Non-Creator Share Test", created_by=self.user)
        self.client.force_authenticate(user=self.other_user)
        payload = {"users": [self.user.id]}
        response = self.client.post(self.share_url(dashboard.pk), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)



class DashboardListTests(APITestCase):
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username="user1", password="password")
        self.other_user = User.objects.create_user(username="user2", password="password")

        # Create organisations
        self.org1 = Organisation.objects.create(name="Organisation 1")
        self.org2 = Organisation.objects.create(name="Organisation 2")

        # Associate user with org1
        self.user.profile.organisations.add(self.org1)

        # Create dashboards
        self.public_dashboard = Dashboard.objects.create(
            title="Public Dashboard",
            created_by=self.other_user,
            privacy_type="public"
        )
        self.restricted_dashboard = Dashboard.objects.create(
            title="Restricted Dashboard",
            created_by=self.other_user,
            privacy_type="restricted"
        )
        self.shared_dashboard = Dashboard.objects.create(
            title="Shared Dashboard",
            created_by=self.other_user,
            privacy_type="restricted"
        )
        self.shared_dashboard.users.add(self.user)
        self.org_dashboard = Dashboard.objects.create(
            title="Org Dashboard",
            created_by=self.other_user,
            privacy_type="organisation"
        )
        self.org_dashboard.organisations.add(self.org1)
        self.private_dashboard = Dashboard.objects.create(
            title="Private Dashboard",
            created_by=self.other_user,
            privacy_type="private"
        )

        self.user_dashboard = Dashboard.objects.create(
            title="User's Dashboard",
            created_by=self.user,
            privacy_type="private"
        )

        # URLs
        self.list_url = reverse("dashboard-list-create")

    def test_unauthenticated_user_can_only_see_public_dashboards(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dashboard_titles = [dashboard["title"] for dashboard in response.data]
        self.assertIn("Public Dashboard", dashboard_titles)
        self.assertNotIn("Restricted Dashboard", dashboard_titles)
        self.assertNotIn("Org Dashboard", dashboard_titles)
        self.assertNotIn("Private Dashboard", dashboard_titles)
        self.assertNotIn("User's Dashboard", dashboard_titles)

    def test_authenticated_user_can_see_allowed_dashboards(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dashboard_titles = [dashboard["title"] for dashboard in response.data]

        # Assert allowed dashboards
        self.assertIn("Public Dashboard", dashboard_titles)
        self.assertIn("Shared Dashboard", dashboard_titles)
        self.assertIn("Org Dashboard", dashboard_titles)
        self.assertIn("User's Dashboard", dashboard_titles)

        # Assert disallowed dashboards
        self.assertNotIn("Restricted Dashboard", dashboard_titles)
        self.assertNotIn("Private Dashboard", dashboard_titles)

    def test_no_dashboards_exist(self):
        Dashboard.objects.all().delete()
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_authenticated_user_can_delete_dashboard(self):
        # Create a dashboard to be deleted
        dashboard_to_delete = Dashboard.objects.create(
            title="Dashboard to be Deleted",
            created_by=self.user,
            privacy_type="private"
        )

        # Authenticate the user for the delete request
        self.client.force_authenticate(user=self.user)

        # Perform the DELETE request using the UUID as the pk in the URL
        response = self.client.delete(
            reverse('dashboard-detail', kwargs={'pk': dashboard_to_delete.pk})
        )

        # Check the response status (204 No Content if successful)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify that the dashboard is deleted from the database
        self.assertFalse(Dashboard.objects.filter(pk=dashboard_to_delete.pk).exists())
