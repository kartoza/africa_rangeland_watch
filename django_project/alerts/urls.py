from rest_framework.routers import DefaultRouter
from .views import (
    IndicatorViewSet,
    AlertSettingViewSet,
    IndicatorAlertHistoryViewSet,
    CategorizedAlertsView,
)
from frontend.api_views.landscape import LandscapeCommunityViewSet

router = DefaultRouter()
router.register(
    r'indicators',
    IndicatorViewSet,
    basename='indicator'
)
router.register(
    r'alert-settings',
    AlertSettingViewSet,
    basename='alert-setting'
)
router.register(
    r'alert-histories',
    IndicatorAlertHistoryViewSet,
    basename='alert-history'
)
router.register(
    r'categorized-alerts',
    CategorizedAlertsView,
    basename='categorized-alert'
)
router.register(
    r'landscape-communities',
    LandscapeCommunityViewSet,
    basename='landscape-communities'
)

urlpatterns = router.urls
