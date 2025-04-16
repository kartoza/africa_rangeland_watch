from rest_framework.routers import DefaultRouter
from .views import (
    IndicatorViewSet,
    AlertSettingViewSet,
    IndicatorAlertHistoryViewSet,
    InAppNotificationViewSet,
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
    r'in-app-notifications',
    InAppNotificationViewSet,
    basename='in-app-notifications'
)

urlpatterns = router.urls
