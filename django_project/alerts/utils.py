# utils.py

from django.core.mail import send_mail
from django.conf import settings
from alerts.models import IndicatorAlertHistory


def send_alert_email(user_email, subject, message):
    """Send an email alert to a user."""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        fail_silently=False,
    )


def trigger_alert(alert_setting, alert_message):
    """Trigger alert and send email if enabled."""
    # Record alert history
    IndicatorAlertHistory.objects.create(
        alert_setting=alert_setting,
        text=alert_message,
    )

    # Send email if enabled
    if alert_setting.email_alert and alert_setting.user.email:
        subject = f"[Alert] {alert_setting.name}"
        send_alert_email(alert_setting.user.email, subject, alert_message)
