from rest_framework import serializers
from .models import Feedback


class FeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for the Feedback model.
    Name and email are read-only as they are auto-filled from the
    authenticated user.
    """
    name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'name', 'email', 'message', 'created_at', 'read']
        read_only_fields = ['id', 'created_at', 'read']

    def validate_message(self, value):
        """
        Validate that the message is not empty and has minimum/maximum length.
        """
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Feedback message cannot be empty."
            )

        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "Feedback message must be at least 3 characters long."
            )

        if len(value.strip()) > 500:
            raise serializers.ValidationError(
                "Feedback message cannot exceed 500 characters."
            )

        return value.strip()
