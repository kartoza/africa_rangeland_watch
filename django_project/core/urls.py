"""Core URL Configuration.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from core.views import PreferencesRedirectView
from .custom_auth_view import (
    CheckTokenView,
    CustomRegistrationView,
    AccountActivationView,
    ForgotPasswordView,
    ResetPasswordConfirmView,
    user_info,
    logout_view
)

urlpatterns = [
    re_path(
        r'^admin/core/preferences/$', PreferencesRedirectView.as_view(),
        name='index'
    ),
    path('admin/', admin.site.urls),
    path(
        'invitations/',
        include('invitations.urls', namespace='invitations')),
    path('', include('base.urls')),
    path('', include('frontend.urls')),
    path('', include('layers.urls')),
    path('api/user-info/', user_info, name='user-info'),
    path('api/logout/', logout_view, name='logout'),
    path('accounts/', include('allauth.urls')),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/activation/', include('allauth.account.urls')),
    path(
        'api/auth/check-token/',
        CheckTokenView.as_view(), name='check-token'
    ),
    path(
        'registration/',
        CustomRegistrationView.as_view(),
        name='registration'
    ),
    path(
        'activate/<uidb64>/<token>/',
        AccountActivationView.as_view(),
        name='account-activation'
    ),
    path(
        'password-reset/',
        ForgotPasswordView.as_view(),
        name='password-reset'
    ),
    path(
        'password-reset/confirm/<uidb64>/<token>/',
        ResetPasswordConfirmView.as_view(),
        name='password-reset-confirm'
    ),
    path('', include('support.urls')),
    path('', include('cloud_native_gis.urls')),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
