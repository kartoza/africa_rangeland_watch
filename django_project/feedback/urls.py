from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeedbackViewSet


app_name = 'feedback'

router = DefaultRouter()
router.register(r'feedback', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('feedback-api/', include(router.urls)),
]
