from unittest.mock import patch
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from alerts.models import Indicator, AlertSetting, IndicatorAlertHistory
from base.models import Organisation, UserOrganisations
from alerts.utils import trigger_alert
from alerts.tasks import process_alerts


class IndicatorTests(APITestCase):
    """Test cases for the Indicator model API."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.indicator = Indicator.objects.create(name="Temperature")

    def test_create_indicator(self):
        """Test creating an indicator."""
        response = self.client.post('/api/indicators/', {'name': 'Humidity'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_indicators(self):
        """Test retrieving the list of indicators."""
        response = self.client.get('/api/indicators/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)


class AlertSettingTests(APITestCase):
    """Test cases for the AlertSetting model API."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass')
        self.client.force_authenticate(user=self.user)
        self.indicator = Indicator.objects.create(name="Temperature")
        self.alert_setting = AlertSetting.objects.create(
            name="High Temp Alert",
            indicator=self.indicator,
            enable_alert=True,
            threshold_value=30.0,
            user=self.user,
        )

    def test_list_alert_settings(self):
        """Test retrieving the list of alert settings."""
        response = self.client.get('/api/alert-settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 7)


class IndicatorAlertHistoryTests(APITestCase):
    """Test cases for the IndicatorAlertHistory model API."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass',
            email='testuser@example.com'
        )
        self.client.force_authenticate(user=self.user)
        self.indicator = Indicator.objects.create(name="Temperature")
        self.alert_setting = AlertSetting.objects.create(
            name="High Temp Alert",
            indicator=self.indicator,
            enable_alert=True,
            threshold_value=30.0,
            user=self.user,
        )
        self.alert_history = IndicatorAlertHistory.objects.create(
            text="Alert triggered for high temperature",
            alert_setting=self.alert_setting
        )

    def test_create_alert_history(self):
        """Test creating an indicator alert history entry."""
        response = self.client.post('/api/alert-histories/', {
            'text': 'New alert for extreme cold',
            'alert_setting_id': self.alert_setting.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_alert_histories(self):
        """Test retrieving the list of indicator alert histories."""
        response = self.client.get('/api/alert-histories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 7)

    def test_trigger_alert_creates_history_and_sends_email(self):
        """Test that trigger_alert creates a history and sends email."""
        with patch("alerts.utils.send_alert_email") as mock_send_email:
            self.alert_setting.email_alert = True
            self.alert_setting.save()

            trigger_alert(self.alert_setting, "Polygon A", 0.6)

            # Assert IndicatorAlertHistory was created
            histories = IndicatorAlertHistory.objects.filter(
                alert_setting=self.alert_setting
            )
            self.assertTrue(histories.exists())
            new_history = histories.exclude(id=self.alert_history.id).last()
            self.assertIn("Polygon A", new_history.text)

            # Assert send_alert_email was called
            mock_send_email.assert_called_once()


class CategorizedAlertsViewTests(APITestCase):
    """Test categorized alerts API view."""

    def setUp(self):
        # Create users
        self.user = User.objects.create_user(
            username="mainuser", password="pass"
        )
        self.orgmate = User.objects.create_user(
            username="orguser", password="pass"
        )
        self.other_user = User.objects.create_user(
            username="external", password="pass"
        )

        # Authenticate as self.user
        self.client.force_authenticate(user=self.user)

        # Create organisation and assign user + orgmate
        self.org = Organisation.objects.create(name="Test Org")
        self.user.profile.organisations.add(self.org)
        self.orgmate.profile.organisations.add(self.org)

        UserOrganisations.objects.get_or_create(
            user_profile=self.user.profile, organisation=self.org
        )
        UserOrganisations.objects.get_or_create(
            user_profile=self.orgmate.profile, organisation=self.org
        )

        # Create indicator
        self.indicator = Indicator.objects.create(name="NDVI")

        # Alert settings
        self.personal_setting = AlertSetting.objects.create(
            name="My Personal Alert",
            indicator=self.indicator,
            user=self.user,
            threshold_value=0.2,
            enable_alert=True,
        )

        self.orgmate_setting = AlertSetting.objects.create(
            name="Orgmate Alert",
            indicator=self.indicator,
            user=self.orgmate,
            threshold_value=0.3,
            enable_alert=True,
        )

        # Simulate system alert
        # self.system_setting = AlertSetting.objects.create(
        #    name="System Alert", indicator=self.indicator, user=None,
        #    threshold_value=0.5, enable_alert=True
        # )

        # Alert histories
        IndicatorAlertHistory.objects.create(
            alert_setting=self.personal_setting,
            text="Personal Alert triggered"
        )

        IndicatorAlertHistory.objects.create(
            alert_setting=self.orgmate_setting,
            text="Organisation Alert triggered"
        )

        # IndicatorAlertHistory.objects.create(
        #    alert_setting=self.system_setting,
        #    text="System Alert triggered"
        # )

    def test_personal_alerts(self):
        response = self.client.get(
            "/api/categorized-alerts/categorized/?category=personal"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            any(
                "Personal Alert" in a["text"] for a in response.data
            )
        )

    def test_organisation_alerts(self):
        response = self.client.get(
            "/api/categorized-alerts/categorized/?category=organization"
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            any(
                "Organisation Alert" in a["text"] for a in response.data
            )
        )

    # def test_system_alerts(self):
    #    response = self.client.get(
    #        "/api/categorized-alerts/categorized/?category=system"
    #    )
    #    self.assertEqual(response.status_code, 200)
    #    self.assertTrue(
    #        any(
    #            "System Alert" in a["text"] for a in response.data
    #        )
    #    )

    def test_all_alerts_combined(self):
        response = self.client.get(
            "/api/categorized-alerts/categorized/?category=all"
        )
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 2)


class ProcessAlertsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="tester",
            password="pass"
        )
        self.indicator = Indicator.objects.create(name="NDVI")

        self.alert_setting = AlertSetting.objects.create(
            name="Test Alert",
            indicator=self.indicator,
            user=self.user,
            threshold_value=0.5,
            threshold_comparison=2,  # Greater than
            enable_alert=True,
            email_alert=False,
        )

    @patch("alerts.tasks.initialize_engine_analysis")
    @patch("alerts.tasks.trigger_alert")
    @patch(
        "alerts.tasks.check_threshold",
        side_effect=lambda setting, value: value > 0.5
    )
    @patch("alerts.tasks.run_analysis")
    def test_alerts_triggered_with_mocked_analysis(
        self,
        mock_run_analysis,
        mock_check_threshold,
        mock_trigger_alert,
        mock_init
    ):
        # Mock the run_analysis to return features with NDVI values
        mock_run_analysis.return_value = (
            {
                "features": [
                    {"properties": {"Name": "Zone A", "NDVI": 0.6}},
                    {
                        "properties": {"Name": "Zone B", "NDVI": 0.4}
                    },  # Should be skipped
                    {"properties": {"Name": "Zone C", "NDVI": 0.7}},
                ]
            },
            None,
        )

        process_alerts()

        # Assert that trigger_alert is called only for values > 0.5
        self.assertEqual(mock_trigger_alert.call_count, 2)
        called_names = [
            call.args[2] for call in mock_trigger_alert.call_args_list
        ]
        self.assertIn("Zone A", called_names)
        self.assertIn("Zone C", called_names)
