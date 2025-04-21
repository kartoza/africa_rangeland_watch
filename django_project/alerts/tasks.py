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
        try:
            # Fetch all (polygon_name, value) for the indicator
            results = get_latest_indicator_value(setting.indicator)

            for result in results:
                name = result.get('name')
                value = result.get('value')

                if name is None or value is None:
                    continue

                if check_threshold(setting, value):
                    trigger_alert(setting, value, name)
                    setting.last_alert = now
                    setting.save()
        except Exception as e:
            raise e
