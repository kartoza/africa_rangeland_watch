from rest_framework.routers import DefaultRouter
from .views import (
    IndicatorViewSet,
    AlertSettingViewSet,
    IndicatorAlertHistoryViewSet
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

urlpatterns = router.urls
