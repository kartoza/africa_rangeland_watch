from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User, Group
from dashboard.models import Dashboard
from base.models import Organisation


def create_user(username, email, password):
    """Helper function to create a user."""
    return User.objects.create_user(username=username, email=email, password=password)


def create_dashboard(title, created_by, privacy_type="private"):
    """Helper function to create a dashboard."""
    return Dashboard.objects.create(title=title, created_by=created_by, privacy_type=privacy_type)


def create_organisation():
    """Helper function to create an organisation."""
    return Organisation.objects.create(name="Test Organisation")


class CustomRegistrationViewTest(TestCase):
    def test_list_dashboards(self):
        """Test listing dashboards."""
        api_client = APIClient()
        user = create_user("testuser", "test@example.com", "password123")
        dashboard1 = create_dashboard("Dashboard 1", user)
        dashboard2 = create_dashboard("Dashboard 2", user)

        api_client.force_authenticate(user=user)
        response = api_client.get("/dashboards/")

        assert response.status_code == 200
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(response.data['results'][0]['title'], dashboard2.title)
        self.assertEqual(response.data['results'][1]['title'], dashboard1.title)


    def test_create_dashboard(self):
        """Test creating a dashboard."""
        api_client = APIClient()
        user = create_user("testuser", "test@example.com", "password123")
        api_client.force_authenticate(user=user)

        payload = {
            "title": "New Dashboard",
            "privacy_type": "private",
        }
        response = api_client.post("/dashboards/", payload)

        self.assertEqual(response.status_code,201)
        assert Dashboard.objects.count() == 1
        assert Dashboard.objects.first().title == "New Dashboard"


    def test_retrieve_dashboard(db):
        """Test retrieving a specific dashboard."""
        api_client = APIClient()
        user = create_user("testuser", "test@example.com", "password123")
        dashboard = create_dashboard("Dashboard 1", user)

        api_client.force_authenticate(user=user)
        response = api_client.get(f"/dashboards/{dashboard.uuid}/")

        assert response.status_code == 200
        assert response.data['title'] == dashboard.title


    def test_update_dashboard(db):
        """Test updating a specific dashboard."""
        api_client = APIClient()
        user = create_user("testuser", "test@example.com", "password123")
        dashboard = create_dashboard("Dashboard 1", user)

        api_client.force_authenticate(user=user)
        payload = {"title": "Updated Dashboard"}
        response = api_client.put(f"/dashboards/{dashboard.uuid}/", payload)

        assert response.status_code == 200
        assert response.data['title'] == "Updated Dashboard"
        dashboard.refresh_from_db()
        assert dashboard.title == "Updated Dashboard"


    def test_delete_dashboard(db):
        """Test deleting a specific dashboard."""
        api_client = APIClient()
        user = create_user("testuser", "test@example.com", "password123")
        dashboard = create_dashboard("Dashboard 1", user)

        api_client.force_authenticate(user=user)
        response = api_client.delete(f"/dashboards/{dashboard.uuid}/")

        assert response.status_code == 204
        assert Dashboard.objects.count() == 0


    def test_share_dashboard(db):
        """Test sharing a dashboard with specific users and groups."""
        api_client = APIClient()
        user = create_user("testuser", "test@example.com", "password123")
        shared_user = create_user("shareduser", "shared@example.com", "password123")
        group = Group.objects.create(name="Test Group")
        dashboard = create_dashboard("Dashboard 1", user)

        api_client.force_authenticate(user=user)
        payload = {
            "users": [shared_user.id],
            "groups": [group.id],
        }
        response = api_client.post(f"/dashboards/{dashboard.uuid}/share/", payload)

        assert response.status_code == 200
        assert shared_user in dashboard.users.all()
        assert group in dashboard.groups.all()
