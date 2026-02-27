from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
import logging


logger = logging.getLogger(__name__)


def get_admin_emails():
    """
    Returns a list of emails for Django superusers.
    """
    admin_users = User.objects.filter(is_superuser=True)
    admin_emails = [user.email for user in admin_users if user.email]

    if not admin_emails:
        logger.warning("No admin users with email addresses found.")

    return admin_emails


class Feedback(models.Model):
    """
    Model for storing user feedback submissions.
    Simple feedback form separate from the technical support ticket system.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_submissions',
        help_text="The user who submitted the feedback"
    )
    name = models.CharField(
        max_length=255,
        help_text="Name of the person submitting feedback"
    )
    email = models.EmailField(
        help_text="Email address of the person submitting feedback"
    )
    message = models.TextField(
        help_text="Feedback message content"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the feedback was submitted"
    )
    read = models.BooleanField(
        default=False,
        help_text="Whether an admin has marked this feedback as read"
    )

    class Meta:
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedback Submissions'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"Feedback from {self.name} on "
            f"{self.created_at.strftime('%Y-%m-%d')}"
        )

    def send_feedback_email(self):
        """
        Send email notification to Django superusers when feedback
        is submitted.
        """
        subject = f"New User Feedback from {self.name}"
        context = {
            'feedback': self,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        }
        html_message = render_to_string(
            'feedback_notification.html',
            context
        )
        admin_emails = get_admin_emails()

        if not admin_emails:
            logger.warning(
                "No admin emails found to send feedback notification."
            )
            return

        email = EmailMultiAlternatives(
            subject=subject,
            body="",  # No plain text content
            from_email=settings.NO_REPLY_EMAIL,
            to=admin_emails,
        )
        email.attach_alternative(html_message, "text/html")

        try:
            email.send()
            logger.info(
                f"Feedback notification sent for feedback ID {self.id}"
            )
        except Exception as e:
            logger.error(
                f"Failed to send feedback notification for feedback ID "
                f"{self.id}: {e}"
            )
