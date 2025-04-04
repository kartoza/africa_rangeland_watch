from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from alerts.models import Indicator, AlertSetting, IndicatorAlertHistory


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
