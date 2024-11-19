from alerts.models import Indicator, AlertSetting
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from support.models import Ticket, IssueType
from rest_framework.authtoken.models import Token
from django.urls import reverse


class TicketViewSetTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.issue_type = IssueType.objects.create(name='Technical Issue')
        indicator = Indicator.objects.create(name="Test Indicator")
        self.alert_setting = AlertSetting.objects.create(
            name='Test Alert',
            email_alert=True,
            indicator_id=indicator.id,
            user=self.user
        )
        self.client.login(username='testuser', password='testpassword')

    def test_create_ticket(self):
        url = reverse('ticket-list')
        data = {
            'title': 'Test Ticket',
            'description': 'Test description',
            'email': 'test@example.com',
            'issue_type': self.issue_type.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ticket.objects.count(), 1)
        self.assertEqual(Ticket.objects.get().title, 'Test Ticket')

    def test_create_ticket_invalid_issue_type(self):
        url = reverse('ticket-list')
        data = {
            'title': 'Test Ticket',
            'description': 'Test description',
            'email': 'test@example.com',
            'issue_type': 9999  # Invalid issue type
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('issue_type', response.data)

    def test_update_ticket_status(self):
        # Create a test ticket
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            email="test@example.com",
            user=self.user,
            issue_type=self.issue_type
        )
        
        url = reverse('ticket-update-status', kwargs={'pk': ticket.id})
        
        # Test: Updating to 'resolved' without resolution summary (should fail)
        data = {'status': 'resolved'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'A resolution summary is required when marking the ticket as resolved.')

        # Test: Updating to 'resolved' with resolution summary (should succeed)
        data = {'status': 'resolved', 'resolution_summary': 'Ticket resolved successfully.'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that the ticket status was updated and resolution summary is saved
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'resolved')
        self.assertEqual(ticket.resolution_summary, 'Ticket resolved successfully.')


    def test_associate_alert(self):
        # Create a test ticket
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            email="test@example.com",
            user=self.user,
            issue_type=self.issue_type
        )
        alert_setting = self.alert_setting
        alert_setting.enable_alert = True
        alert_setting.save()

        url = reverse('ticket-associate-alert', kwargs={'pk': ticket.id})

        # Test data with valid alert_setting_id
        data = {'alert_setting_id': alert_setting.id}

        # Send the POST request to associate the alert
        response = self.client.post(url, data, format='json')

        # Check if the response status is OK (200)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Reload the ticket from the database to check if the association worked
        ticket.refresh_from_db()
        self.assertEqual(ticket.alert_setting, alert_setting)


    def test_associate_alert_not_enabled(self):
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            email="test@example.com",
            user=self.user,
            issue_type=self.issue_type
        )
        url = reverse('ticket-associate-alert', kwargs={'pk': ticket.id})
        data = {'alert_setting_id': self.alert_setting.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
