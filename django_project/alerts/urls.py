from rest_framework.routers import DefaultRouter
from .views import (
    IndicatorViewSet,
    AlertSettingViewSet,
    IndicatorAlertHistoryViewSet,
    CategorizedAlertsView,
)

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

urlpatterns = router.urls
