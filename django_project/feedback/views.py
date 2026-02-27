from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Feedback
from .serializers import FeedbackSerializer
import logging


logger = logging.getLogger(__name__)


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user feedback submissions.

    create: Submit new feedback (authenticated users only)
    list: View user's own feedback history (optional)
    """
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Users can only see their own feedback submissions.
        Superusers can see all feedback.
        """
        user = self.request.user
        if user.is_superuser:
            return Feedback.objects.all()
        return Feedback.objects.filter(user=user)

    def perform_create(self, serializer):
        """
        Auto-fill name and email from authenticated user and send
        notification email.
        """
        user = self.request.user

        # Auto-fill user information
        feedback = serializer.save(
            user=user,
            name=user.get_full_name() or user.username,
            email=user.email
        )

        # Send email notification to admins
        try:
            feedback.send_feedback_email()
            logger.info(
                f"Feedback {feedback.id} created by user {user.username}"
            )
        except Exception as e:
            logger.error(f"Error sending feedback email: {e}")
            # Don't fail the request if email fails

    def create(self, request, *args, **kwargs):
        """
        Override create to provide custom response messages.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(
            {
                'message': (
                    'Thank you for your feedback! '
                    'Your submission has been received.'
                ),
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
