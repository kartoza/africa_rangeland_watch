# serializers.py

from rest_framework import serializers
from .models import Ticket
from .models import IssueType


class IssueTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueType
        fields = ['id', 'name']


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'issue_type', 'description', 'email',
            'file_attachment', 'status', 'created_at', 'updated_at'
        ]

    def validate_file_attachment(self, value):
        if value and not value.name.endswith(('.jpg', '.png', '.pdf')):
            raise serializers.ValidationError(
                "File format not supported. Only JPG, PNG, and PDF are"
                "allowed."
            )
        return value


class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['title', 'description', 'email', 'file_attachment']
