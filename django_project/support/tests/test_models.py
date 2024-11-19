from django.test import TestCase  # noqa: F401

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from alerts.models import Indicator, AlertSetting
from support.models import Ticket, IssueType
from django.utils import timezone
from unittest.mock import patch


class TicketModelTest(TestCase):
    
    def setUp(self):
        # Create test users
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.issue_type = IssueType.objects.create(name='Technical Issue')
    
    def test_ticket_str_method(self):
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            user=self.user,
            email="test@example.com"
        )
        self.assertEqual(str(ticket), ticket.title)
    
    def test_ticket_resolution_summary_required_when_resolved(self):
        # Create a ticket with status 'resolved' but no resolution summary
        ticket = Ticket(
            title="Test Ticket",
            description="Test description",
            user=self.user,
            email="test@example.com",
            status='resolved'
        )

        # Check if the validation error is raised when no resolution_summary is provided
        with self.assertRaises(ValidationError):
            ticket.full_clean()
            ticket.save() 
    
    def test_send_ticket_submission_email(self):
        # Create a new ticket
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            user=self.user,
            email="test@example.com"
        )

    def test_send_status_update_email(self):
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            user=self.user,
            email="test@example.com"
        )

        ticket.status = 'in_progress'
        ticket.save()
    
    def test_ticket_associated_alert_email(self):
        # Create a required indicator for the alert setting
        indicator = Indicator.objects.create(name="Test Indicator")
        self.user = User.objects.create_user(username='testuser3', password='testpassword')
        alert_setting = AlertSetting.objects.create(
            name='Test Alert',
            email_alert=True,
            indicator=indicator,
            user=self.user
        )
        
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            user=self.user,
            email="test@example.com"
        )

        ticket.alert_setting = alert_setting
        ticket.save()


