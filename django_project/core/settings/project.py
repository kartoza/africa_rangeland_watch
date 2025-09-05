# coding=utf-8

"""Project level settings.

Adjust these values as needed but don't commit passwords etc. to any public
repository!
"""
import os  # noqa

from .contrib import *  # noqa

ALLOWED_HOSTS = ['*']
ADMINS = (
    ('Dimas Ciputra', 'dimas@kartoza.com'),
)
NO_REPLY_EMAIL = os.getenv("NO_REPLY_EMAIL", "noreply@kartoza.com")
DJANGO_BACKEND_URL = os.getenv("DJANGO_BACKEND_URL", "http://localhost:8888/")
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ['DATABASE_NAME'],
        'USER': os.environ['DATABASE_USERNAME'],
        'PASSWORD': os.environ['DATABASE_PASSWORD'],
        'HOST': os.environ['DATABASE_HOST'],
        'PORT': 5432,
        'TEST_NAME': 'unittests',
    }
}

# Set debug to false for production
DEBUG = TEMPLATE_DEBUG = False

# Extra installed apps
PROJECT_APPS = (
    'core',
    'frontend',
    'base',
    'alerts',
    'dashboard',
    'analysis',
    'layers',
    'support',
    'earthranger',
)
INSTALLED_APPS = INSTALLED_APPS + PROJECT_APPS

TEMPLATES[0]['DIRS'] += [
    absolute_path('frontend', 'templates'),
    absolute_path('support', 'templates'),
    absolute_path('base', 'templates'),
]

# GCS BUCKET NAME
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "ktz-dev-bkt-gcs-01")

# GEE ASSET ID PREFIX
GEE_ASSET_ID_PREFIX = os.getenv("GEE_ASSET_ID_PREFIX", "projects/ee-dng/assets/")
