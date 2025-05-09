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
    Retrieves the latest values per polygon for the given indicator
    directly from analysis_results JSON.
    """
    latest_result = (
        UserAnalysisResults.objects
        .order_by('-created_at')
        .first()
    )

    if not latest_result:
        raise ValueError(f"No results found for indicator: {indicator.name}")

    features = (
        latest_result.analysis_results
        .get('results', {})
        .get('features', [])
    )

    if not features:
        raise ValueError(
            f"No features found in analysis result for {indicator.name}"
        )

    per_polygon = []
    for feature in features:
        props = feature.get("properties", {})
        name = props.get("Name")
        value = props.get(indicator.name)
        if name is not None and value is not None:
            per_polygon.append({"name": name, "value": value})

    if not per_polygon:
        raise ValueError(f"No valid polygon stats found for {indicator.name}")

    return per_polygon
