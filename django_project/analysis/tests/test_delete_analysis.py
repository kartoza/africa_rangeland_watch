from django.test import TestCase  # noqa: F401
from analysis.models import UserAnalysisResults
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from dashboard.models import Dashboard

User = get_user_model()


class DeleteAnalysisTestCase(APITestCase):

    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword"
        )
        self.client.force_authenticate(user=self.user)  # Authenticate user

        # Create test analyses
        self.analysis1 = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={"data": "test1"}
        )
        self.analysis2 = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={"data": "test2"}
        )

        # Create dashboards
        self.dashboard1 = Dashboard.objects.create(
            title="Dashboard 1",
            created_by=self.user
        )
        self.dashboard2 = Dashboard.objects.create(
            title="Dashboard 2",
            created_by=self.user
        )

        # Associate analysis with dashboards
        self.dashboard1.analysis_results.add(self.analysis1)
        self.dashboard2.analysis_results.add(self.analysis1, self.analysis2)

    def test_delete_analysis_removes_from_dashboards(self):

        response = self.client.delete(
            f"/user_analysis_results/{self.analysis1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Ensure the analysis is deleted
        self.assertFalse(
            UserAnalysisResults.objects.filter(
                id=self.analysis1.id).exists())

        # Ensure dashboard2 still has analysis2
        self.dashboard2.refresh_from_db()
        self.assertIn(self.analysis2, self.dashboard2.analysis_results.all())

    def test_delete_analysis_deletes_dashboard_if_no_other_analysis(self):

        response = self.client.delete(
            f"/user_analysis_results/{self.analysis1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Dashboard2 should still exist as it has analysis2
        self.assertTrue(Dashboard.objects.filter
                        (pk=self.dashboard2.pk).exists())

    def test_delete_analysis_not_associated_with_any_dashboard(self):
        # Create an analysis that is not linked to any dashboard
        independent_analysis = UserAnalysisResults.objects.create(
            created_by=self.user, analysis_results={"data": "independent"})

        response = self.client.delete(
            f"/user_analysis_results/{independent_analysis.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Ensure the analysis is deleted
        self.assertFalse(UserAnalysisResults.objects.filter(
            id=independent_analysis.id).exists())

    def test_delete_non_existent_analysis(self):
        """Test that deleting a non-existent analysis returns 404."""

        response = self.client.delete("/user_analysis_results/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
