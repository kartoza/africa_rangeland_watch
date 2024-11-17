from django.db import models
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from django.template.loader import render_to_string

from alerts.models import AlertSetting, Indicator
import logging


logger = logging.getLogger(__name__)


class IssueType(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


STATUS_CHOICES = [
    ('open', 'Open'),
    ('in_progress', 'In Progress'),
    ('resolved', 'Resolved'),
    ('pending', 'Pending'),
]


class Ticket(models.Model):
    title = models.CharField(max_length=255)
    issue_type = models.ForeignKey(
        IssueType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        help_text="The type of issue for the ticket"
    )
    description = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='open'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    assigned_to = models.ForeignKey(
        User,
        related_name="assigned_tickets",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    email = models.EmailField()
    alert_setting = models.ForeignKey(
        AlertSetting,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        help_text='The alert setting associated with this ticket.'
    )
    indicator = models.ForeignKey(
        Indicator,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets',
        help_text='The indicator related to this ticket.'
    )
    file_attachment = models.FileField(
        upload_to='ticket_attachments/',
        null=True,
        blank=True
    )
    resolution_summary = models.TextField(
        null=True,
        blank=True,
        help_text=(
            "Summary of the resolution provided by the admin when the ticket "
            "is resolved."
        )
    )


    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == 'resolved' and not self.resolution_summary:
            raise ValueError(
                "A resolution summary is required when marking the ticket as"
                "resolved."
            )
        super().save(*args, **kwargs)

    def send_ticket_submission_email(self):
        """Send an email to the support admin when a ticket is submitted."""
        subject = f"New Support Ticket: {self.title}"
        context = {
            'ticket': self,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        }
        html_message = render_to_string(
            'new_ticket_notification.html', context
        )
        support_staff = settings.SUPPORT_STAFF

        if isinstance(support_staff, str):
            support_staff = [
                email.strip() for email in support_staff.split(',')
            ]


        try:
            send_mail(
                subject,
                '',
                settings.NO_REPLY_EMAIL,
                support_staff,
                html_message=html_message
            )
        except Exception as e:
            logger.error(
                f"Failed to send ticket submission email for ticket {self.id}:"
                f"{e}"
            )


    def send_status_update_email(self):
        """Email the user when the status of their ticket is updated."""
        status_titles = {
            'open': 'Ticket Opened',
            'in_progress': 'Ticket In Progress',
            'resolved': 'Ticket Resolved',
            'pending': 'Ticket Pending',
        }

        subject = (
            f"{status_titles.get(self.status, 'Ticket Update')}: "
            f"{self.title}"
        )


        context = {
            'title': subject,
            'ticket': self,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        }

        html_message = render_to_string(
            'templates/ticket_status_update.html', context
        )

        try:
            send_mail(
                subject,
                '',
                settings.NO_REPLY_EMAIL,
                [self.email],
                html_message=html_message
            )
        except Exception as e:
            logger.error(
                f"Failed to send ticket submission email for ticket {self.id}:"
                f"{e}"
            )

    def send_ticket_details_email(self):
        """Send ticket details to the user."""
        subject = f"Support Ticket Details: {self.id}"
        context = {
            'ticket': self,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        }
        html_message = render_to_string(
            'templates/ticket_details.html', context
        )

        try:
            send_mail(
                subject,
                '',
                settings.NO_REPLY_EMAIL,
                [self.email],
                html_message=html_message
            )
        except Exception as e:
            logger.error(
                f"Failed to send ticket submission email for ticket {self.id}:"
                f"{e}"
            )

    def send_alert_email(self):
        """Send an email when a ticket is associated with an alert."""

        if self.alert_setting and self.alert_setting.email_alert:
            subject = f"Alert: {self.title}"
            context = {'ticket': self}
            html_message = render_to_string(
                'emails/alert_ticket_notification.html',
                context
            )

            try:
                send_mail(
                    subject, '',
                    settings.NO_REPLY_EMAIL,
                    [self.email],
                    html_message=html_message
                )
            except Exception as e:
                logger.error(
                    f"Failed to send alert email for ticket {self.id}: {e}"
                )
