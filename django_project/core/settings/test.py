from .dev import *  # noqa

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache'
    }
}

WEBPACK_LOADER['DEFAULT']['STATS_FILE'] = absolute_path(
    'frontend', 'webpack-stats.prod.json'
)