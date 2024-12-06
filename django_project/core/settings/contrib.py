# coding=utf-8
"""Settings for 3rd party."""
from .base import *  # noqa

# Extra installed apps
INSTALLED_APPS = INSTALLED_APPS + (
    'rest_framework',
    'rest_framework_gis',
    'webpack_loader',
    'guardian',
    'django_cleanup.apps.CleanupConfig',
    'django_celery_beat',
    'django_celery_results',

    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'dj_rest_auth.registration',

    'invitations',
    'drf_yasg',
    'cloud_native_gis'
)

MIDDLEWARE += (
    "allauth.account.middleware.AccountMiddleware",
)

WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'frontend/',  # must end with slash
        'STATS_FILE': absolute_path('frontend', 'webpack-stats.prod.json'),
        'POLL_INTERVAL': 0.1,
        'TIMEOUT': None,
        'IGNORE': [r'.+\.hot-update.js', r'.+\.map'],
        'LOADER_CLASS': 'webpack_loader.loader.WebpackLoader',
    }
}
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_VERSIONING_CLASS': (
        'rest_framework.versioning.NamespaceVersioning'
    ),
     'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/minute',  # This limits to 30 requests per minute for anonymous users.
    },
    'DEFAULT_PAGINATION_CLASS': (
        'core.pagination.Pagination'
    ),
    'PAGE_SIZE': 100
}
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
]


AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',  # default
    'allauth.account.auth_backends.AuthenticationBackend',
    'guardian.backends.ObjectPermissionBackend',
)
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
CELERY_RESULT_BACKEND = 'django-db'

TEMPLATES[0]['OPTIONS']['context_processors'] += [
    'django.template.context_processors.request',
]

SENTRY_DSN = os.environ.get('SENTRY_DSN', '')

INVITATIONS_INVITATION_EXPIRY = 7
INVITATIONS_INVITATION_MODEL = 'base.OrganisationInvitation'

ACCOUNT_ADAPTER = "invitations.models.InvitationsAdapter"
INVITATIONS_ADAPTER = ACCOUNT_ADAPTER
INVITATIONS_ACCEPT_INVITE_AFTER_SIGNUP = True

ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_AUTHENTICATED_LOGIN_REDIRECTS = False
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_AUTHENTICATED_REMEMBER = True
ACCOUNT_USERNAME_REQUIRED = False
