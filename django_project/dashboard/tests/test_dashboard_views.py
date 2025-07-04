import uuid
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User, Group
from base.models import Organisation, UserProfile
from analysis.models import UserAnalysisResults
from dashboard.models import Dashboard, DashboardWidget
from django.urls import reverse
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from uuid import uuid4

User = get_user_model()


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


class UpdateDashboardViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="password")
        self.client.force_authenticate(user=self.user)
        self.dashboard = Dashboard.objects.create(
            uuid=uuid4(), title="Original Title", privacy_type="private", created_by=self.user
        )
        self.analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user, analysis_results={"key": "value"}
        )

    def test_update_dashboard_title(self):
        url = f"/dashboards/{self.dashboard.uuid}/update/"
        data = {"title": "Updated Title"}
        response = self.client.patch(url, data, format='json')
        
        self.dashboard.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.dashboard.title, "Updated Title")

    def test_update_dashboard_privacy_type(self):
        url = f"/dashboards/{self.dashboard.uuid}/update/"
        data = {"privacy_type": "public"}
        response = self.client.patch(url, data, format='json')
        
        self.dashboard.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.dashboard.privacy_type, "public")

    def test_update_dashboard_analysis_results(self):
        url = f"/dashboards/{self.dashboard.uuid}/update/"
        data = {"analysis_results": [self.analysis_result.id]}
        response = self.client.patch(url, data, format='json')
        
        self.dashboard.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(self.analysis_result, self.dashboard.analysis_results.all())

    def test_update_dashboard_config(self):
        url = f"/dashboards/{self.dashboard.uuid}/update/"
        new_config = {"theme": "dark", "layout": "grid"}
        data = {"config": new_config}
        response = self.client.patch(url, data, format='json')
        
        self.dashboard.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.dashboard.config, new_config)

    def test_update_dashboard_unauthenticated(self):
        self.client.logout()
        url = f"/dashboards/{self.dashboard.uuid}/update/"
        data = {"title": "Unauthorized Update"}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_non_existent_dashboard(self):
        url = f"/dashboards/{uuid4()}/update/"
        data = {"title": "Non-existent Dashboard"}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DashboardFilterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        
        # Create analysis results
        self.analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={"data": {"period": {"year": 2016}, "latitude": -22.857254696359078, "variable": "NDVI", "community": "00000000000000000183", "landscape": "Bahine NP", "longitude": 32.38778376824476, "analysisType": "Spatial", "communityName": "BNP western polygon", "reference_layer": {"type": "MultiPolygon", "coordinates": [[[[31.980830392039053, -22.4556267181258]]]]}, "comparisonPeriod": {"year": 2025}, "communityFeatureId": 5, "temporalResolution": "Annual"}, "results": {"type": "FeatureCollection", "columns": {"mean": "Float<-793.8117369027394, 593.7905346956287>"}, "features": [{"id": "00000000000000000161", "type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[32.26742472442872, -23.269339622908447]]]}, "properties": {"Name": "LNP-BNP corridor", "area": 240233.35598144837, "mean": 3.632694848867527, "Project": "Limpopo NP Project"}}, {"id": "00000000000000000183", "type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[32.6216952837754, -23.057204460192278], [32.6216952837754, -23.057204460192278]]]}, "properties": {"Name": "BNP western polygon", "area": 310735.1568372569, "mean": -4.29935241113407, "Project": "Bahine National Park"}}]}}
        )
        
        # Create dashboards
        self.dashboard1 = Dashboard.objects.create(
            uuid=uuid.uuid4(),
            title="Dashboard 1",
            created_by=self.user,
            privacy_type='public',
            config={"dashboardName": "Category1", "preference": "Keyword1", "chartType": "map"}
        )
        self.dashboard1.analysis_results.add(self.analysis_result)
        
        self.dashboard2 = Dashboard.objects.create(
            uuid=uuid.uuid4(),
            title="Dashboard 2",
            created_by=self.user,
            privacy_type='private',
            config={"dashboardName": "Category2", "preference": "map", "chartType": "region-2"}
        )
        
        self.dashboard3 = Dashboard.objects.create(
            uuid=uuid.uuid4(),
            title="Dashboard 3",
            created_by=self.user,
            privacy_type='organisation',
            config={"dashboardName": "Category3", "preference": "Keyword3", "chartType": "region-1"}
        )
        self.dashboard3.analysis_results.add(self.analysis_result)

    def test_filter_by_region(self):
        response = self.client.get("/dashboards/", {"region": "Bahine NP"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_filter_by_category(self):
        response = self.client.get("/dashboards/", {"category": "Category1"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["uuid"], str(self.dashboard1.uuid))
    
    def test_filter_by_keyword(self):
        response = self.client.get("/dashboards/", {"keyword": "Keyword3"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["uuid"], str(self.dashboard3.uuid))
    
    def test_filter_by_maps_preference(self):
        response = self.client.get("/dashboards/", {"maps": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["uuid"], str(self.dashboard2.uuid))
    
    def test_filter_by_owner(self):
        response = self.client.get("/dashboards/", {"owner": "testuser"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)


class DashboardDetailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", password="password")
        self.other_user = User.objects.create_user(username="otheruser", password="password")
        self.client.force_authenticate(user=self.user)
        
        self.dashboard = Dashboard.objects.create(
            uuid=uuid4(), 
            title="Original Title", 
            privacy_type="private", 
            created_by=self.user,
            config={"version": "1.0", "dashboardDescription": "Original description"},
            metadata={"key": "value"}
        )
        
        self.analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user, analysis_results={"key": "value"}
        )
        
        # Create some widgets for testing
        self.widget1 = DashboardWidget.objects.create(
            dashboard=self.dashboard,
            widget_type="chart",
            title="Widget 1",
            order=0,
            config={"size": 2, "height": "medium"},
            text_content="Content 1",
            description="Description 1",
            analysis_result=self.analysis_result
        )
        
        self.widget2 = DashboardWidget.objects.create(
            dashboard=self.dashboard,
            widget_type="map",
            title="Widget 2",
            order=1,
            config={"size": 4, "height": "large"},
            text_content="Content 2",
            description="Description 2",
            analysis_result=self.analysis_result
        )

    def test_get_dashboard_detail(self):
        """Test retrieving dashboard details."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Original Title")

    def test_get_dashboard_detail_unauthenticated(self):
        """Test that unauthenticated users cannot access dashboard details."""
        self.client.logout()
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_non_existent_dashboard(self):
        """Test retrieving details of a non-existent dashboard."""
        url = f"/dashboards/{uuid4()}/detail/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_dashboard_title_and_metadata(self):
        """Test updating dashboard title and metadata via POST."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {
            "title": "Updated Title",
            "version": "2.0",
            "description": "Updated description",
            "metadata": {"new_key": "new_value"}
        }
        response = self.client.post(url, data, format='json')
        
        self.dashboard.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.dashboard.title, "Updated Title")
        self.assertEqual(self.dashboard.config["version"], "2.0")
        self.assertEqual(self.dashboard.config["dashboardDescription"], "Updated description")
        self.assertEqual(self.dashboard.metadata, {"new_key": "new_value"})

    def test_update_dashboard_by_non_owner(self):
        """Test that non-owners cannot update dashboard."""
        self.client.force_authenticate(user=self.other_user)
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {"title": "Unauthorized Update"}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You do not have permission to update this dashboard", response.data["error"])

    def test_update_existing_widget(self):
        """Test updating an existing widget."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {
            "widgets": [
                {
                    "id": str(self.widget1.id),
                    "type": "updated_chart",
                    "title": "Updated Widget 1",
                    "config": {"custom": "config"},
                    "size": 3,
                    "height": "large",
                    "content": "Updated content",
                    "description": "Updated description",
                    "analysis_result_id": self.analysis_result.id
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.widget1.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.widget1.widget_type, "updated_chart")
        self.assertEqual(self.widget1.title, "Updated Widget 1")
        self.assertEqual(self.widget1.config["size"], 3)
        self.assertEqual(self.widget1.config["height"], "large")
        self.assertEqual(self.widget1.text_content, "Updated content")
        self.assertEqual(self.widget1.description, "Updated description")
        self.assertEqual(self.widget1.analysis_result_id, self.analysis_result.id)

    def test_create_new_widget(self):
        """Test creating a new widget."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {
            "widgets": [
                {
                    "id": "new_widget_1",
                    "type": "new_chart",
                    "title": "New Widget",
                    "config": {"new": "config"},
                    "size": 2,
                    "height": "medium",
                    "content": "New content",
                    "description": "New description",
                    "analysis_result_id": self.analysis_result.id
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_widget = self.dashboard.widgets.filter(title="New Widget").first()
        self.assertIsNotNone(new_widget)
        self.assertEqual(new_widget.widget_type, "new_chart")
        self.assertEqual(new_widget.config["size"], 2)
        self.assertEqual(new_widget.config["height"], "medium")

    def test_remove_widgets_not_in_request(self):
        """Test that widgets not included in the request are removed."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        # Only include widget1, widget2 should be removed
        data = {
            "widgets": [
                {
                    "id": str(self.widget1.id),
                    "type": self.widget1.widget_type,
                    "title": self.widget1.title
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(DashboardWidget.objects.filter(id=self.widget1.id).exists())
        self.assertFalse(DashboardWidget.objects.filter(id=self.widget2.id).exists())

    def test_update_non_existent_widget(self):
        """Test updating a widget that doesn't exist."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {
            "widgets": [
                {
                    "id": "99999",  # Non-existent widget ID
                    "type": "chart",
                    "title": "Non-existent Widget"
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Widget not found", response.data["error"])

    def test_widget_order_preservation(self):
        """Test that widget order is preserved based on array index."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {
            "widgets": [
                {
                    "id": str(self.widget2.id),
                    "type": self.widget2.widget_type,
                    "title": self.widget2.title
                },
                {
                    "id": str(self.widget1.id),
                    "type": self.widget1.widget_type,
                    "title": self.widget1.title
                }
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.widget1.refresh_from_db()
        self.widget2.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.widget2.order, 0)  # First in array
        self.assertEqual(self.widget1.order, 1)  # Second in array

    def test_empty_widgets_removes_all(self):
        """Test that passing empty widgets array removes all widgets."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {"widgets": []}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.dashboard.widgets.count(), 0)

    def test_partial_dashboard_update(self):
        """Test updating only some dashboard fields."""
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {
            "title": "Partially Updated Title"
            # Not including version, description, metadata, or widgets
        }
        response = self.client.post(url, data, format='json')
        
        self.dashboard.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.dashboard.title, "Partially Updated Title")
        # Original values should be preserved
        self.assertEqual(self.dashboard.config["version"], "1.0")
        self.assertEqual(self.dashboard.config["dashboardDescription"], "Original description")

    def test_update_dashboard_unauthenticated(self):
        """Test that unauthenticated users cannot update dashboard."""
        self.client.logout()
        url = f"/dashboards/{self.dashboard.uuid}/detail/"
        data = {"title": "Unauthorized Update"}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_non_existent_dashboard(self):
        """Test updating a non-existent dashboard."""
        url = f"/dashboards/{uuid4()}/detail/"
        data = {"title": "Non-existent Dashboard"}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
