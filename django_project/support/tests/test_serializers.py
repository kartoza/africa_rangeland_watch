from rest_framework.exceptions import ValidationError
from django.test import TestCase
from support.models import Ticket, IssueType
from support.serializers import TicketSerializer, TicketCreateSerializer
from django.contrib.auth.models import User


class TicketSerializerTest(TestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.issue_type = IssueType.objects.create(name='Technical Issue')
    
    def test_ticket_create_serializer_valid_data(self):
        data = {
            'title': "Test Ticket",
            'description': "Test description",
            'email': "test@example.com",
        }
        serializer = TicketCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_ticket_create_serializer_invalid_file_attachment(self):
        data = {
            'title': "Test Ticket",
            'description': "Test description",
            'email': "test@example.com",
            'file_attachment': "invalid_file.exe",  # Invalid file type
        }
        serializer = TicketCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        # Check if there are errors for the 'file_attachment' field
        self.assertIn('file_attachment', serializer.errors)

    def test_ticket_serializer_validation(self):
        ticket = Ticket.objects.create(
            title="Test Ticket",
            description="Test description",
            user=self.user,
            email="test@example.com",
            issue_type=self.issue_type
        )
        serializer = TicketSerializer(ticket)
        self.assertEqual(serializer.data['title'], ticket.title)
        self.assertEqual(serializer.data['description'], ticket.description)

