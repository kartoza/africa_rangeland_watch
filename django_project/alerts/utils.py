# utils.py

from django.core.mail import send_mail
from django.conf import settings
from alerts.models import IndicatorAlertHistory, Indicator
from analysis.models import UserAnalysisResults


def send_alert_email(user_email, subject, message):
    """Send an email alert to a user."""
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        fail_silently=False,
    )


def trigger_alert(alert_setting, value, name):
    """Trigger alert and send email if enabled."""
    message = (
        f"Threshold met for '{name}': {value} "
        f"({alert_setting.indicator.name})"
    )
    # Record alert history
    IndicatorAlertHistory.objects.create(
        alert_setting=alert_setting,
        text=message,
    )

    # Send email if enabled
    if alert_setting.email_alert and alert_setting.user.email:
        subject = f"[Alert] {alert_setting.name}"
        send_alert_email(alert_setting.user.email, subject, message)


def check_threshold(alert_setting, value: float) -> bool:
    """
    Compares a given value to the threshold defined in the alert_setting.
    Comparison types:
        1 = Less Than
        2 = Greater Than
        3 = Equal To
    """
    comparison = alert_setting.threshold_comparison
    threshold = alert_setting.threshold_value

    if comparison == 1:  # Less Than
        return value < threshold
    elif comparison == 2:  # Greater Than
        return value > threshold
    elif comparison == 3:  # Equal To
        return value == threshold
    return False


def get_latest_indicator_value(indicator: Indicator) -> list[dict]:
    """
    Retrieves the latest values per polygon for the given indicator.
    """

    # Fetch the latest UserAnalysisResults linked to this indicator
    latest_result = (
        UserAnalysisResults.objects
        .filter(raster_outputs__analysis__indicator=indicator.id)
        .order_by('-created_at')
        .prefetch_related('raster_outputs')
        .first()
    )

    if not latest_result:
        raise ValueError(f"No results found for indicator: {indicator.name}")

    # First raster output
    raster = latest_result.raster_outputs.first()
    if not raster:
        raise ValueError(
            f"No raster output found in latest result for {indicator.name}"
        )

    stats_list = raster.analysis.get('per_polygon_stats', None)
    if not stats_list or not isinstance(stats_list, list):
        raise ValueError(f"No per-polygon stats found for {indicator.name}")

    # Validate each entry
    return [
        {"name": item.get("name"), "value": item.get("value")}
        for item in stats_list
        if item.get("name") is not None and item.get("value") is not None
    ]
