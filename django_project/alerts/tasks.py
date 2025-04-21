from celery import shared_task
from django.utils import timezone
from alerts.models import AlertSetting
from alerts.utils import (
    trigger_alert,
    check_threshold,
    get_latest_indicator_value
)


@shared_task
def process_alerts():
    """
    Check all alert settings and
    trigger alerts if thresholds are breached.
    """
    now = timezone.now()

    for setting in AlertSetting.objects.filter(enable_alert=True):
        # Fetch the latest indicator value
        value = get_latest_indicator_value(setting.indicator)

        # Check threshold logic
        if check_threshold(setting, value):
            trigger_alert(
                setting,
                f"Threshold met: {value} for {setting.name}"
            )
            setting.last_alert = now
            setting.save()
