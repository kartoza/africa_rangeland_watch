from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)
from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.shortcuts import redirect
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from django.core.exceptions import MultipleObjectsReturned



class CheckTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "message": "Token is valid",
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }, status=status.HTTP_200_OK)


class CustomRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password1 = request.data.get('password1')

        error_messages = []

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            error_messages.append('Email is already registered.')

        if error_messages:
            return Response(
                {'email': error_messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = get_user_model().objects.create_user(
            email=email,
            password=password1,
            username=email
        )
        user.is_active = False
        user.save()

        # Create activation token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(str(user.pk).encode())

        # Build activation link
        activation_link = f"{
            get_current_site(request).domain}/auth/activate/{uid}/{token}/"

        # Send activation email (use a custom template for this)
        subject = "Activate Your Account"
        message = render_to_string('account/email_confirmation.html', {
            'user': user,
            'activation_url': activation_link,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        })
        send_mail(subject, message, settings.NO_REPLY_EMAIL, [email])

        return Response(
            {
                'message': 'verification email sent.'
            },
            status=status.HTTP_201_CREATED
        )


class AccountActivationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token, *args, **kwargs):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = get_user_model().objects.get(pk=uid)
        except (
            TypeError, ValueError,
            OverflowError, get_user_model().DoesNotExist
        ):
            return JsonResponse(
                {'error': 'Invalid activation link'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            redirect_url = (
                f"{settings.DJANGO_BACKEND_URL}/#/?"
                "registration_complete=true"
            )


            return redirect(redirect_url)

        return JsonResponse(
            {'error': 'Invalid activation link'},
            status=status.HTTP_400_BAD_REQUEST
        )


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')

        try:
            users = get_user_model().objects.filter(email=email)
            if not users.exists():
                return Response(
                    {'error': 'Email not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif users.count() > 1:
                return Response(
                    {'error': 'Multiple users with this email address'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user = users.first()

        except MultipleObjectsReturned:
            return Response(
                {'error': 'Multiple users with this email address'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(str(user.pk).encode())

        reset_password_link = (
            f"{get_current_site(request).domain}/auth/password-reset/"
            f"{uid}/{token}/"
        )

        # Send the password reset email
        subject = "Password Reset"
        message = render_to_string('account/password_reset_email.html', {
            'user': user,
            'reset_password_url': reset_password_link,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        })
        send_mail(subject, message, settings.NO_REPLY_EMAIL, [email])

        return Response(
            {'message': 'Password reset link sent to your email.'},
            status=status.HTTP_200_OK
        )



class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token, *args, **kwargs):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = get_user_model().objects.get(pk=uid)
        except (
            TypeError, ValueError,
            OverflowError,
            get_user_model().DoesNotExist
        ):
            return Response(
                {'error': 'Invalid reset link'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if default_token_generator.check_token(user, token):
            new_password = request.data.get('new_password')
            user.set_password(new_password)
            user.save()
            return Response(
                {'message': 'Password has been successfully reset.'},
                status=status.HTTP_200_OK
            )

        return Response(
            {'error': 'Invalid reset link'},
            status=status.HTTP_400_BAD_REQUEST
        )
