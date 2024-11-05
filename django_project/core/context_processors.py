"""Context processors."""
from django.conf import settings


def sentry_dsn(request):
    """Retrieve sentry dsn from settings."""
    return {
        'SENTRY_DSN': settings.SENTRY_DSN
    }
