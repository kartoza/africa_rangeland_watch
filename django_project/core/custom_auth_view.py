from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)
from django.template.loader import render_to_string
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework.permissions import AllowAny
from django.core.exceptions import MultipleObjectsReturned
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.contrib.auth.password_validation import validate_password
from rest_framework.throttling import AnonRateThrottle
from django.core.mail import EmailMultiAlternatives
from rest_framework.decorators import api_view
from django.contrib.auth import logout



@api_view(["POST"])
def logout_view(request):
    """
    Logs out the user and clears the session.
    """
    logout(request)
    return Response({"message": "Successfully logged out"}, status=200)


@api_view(["POST"])
def user_info(request):
    if request.user.is_authenticated:
        return Response({
            "user": {
                "username": request.user.username,
                "email": request.user.email,
            },
            "is_authenticated": True
        })
    return Response({"is_authenticated": False}, status=401)


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
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password1 = request.data.get('password1')
        password2 = request.data.get('password2')

        error_messages = []

        try:
            # Validate email format
            try:
                EmailValidator()(email)
            except ValidationError:
                error_messages.append('Invalid email format.')

            # Check if email already exists
            if get_user_model().objects.filter(email=email).exists():
                error_messages.append('Email is already registered.')

            # Check password match
            if password1 != password2:
                error_messages.append('Passwords do not match.')

            # Validate password strength
            try:
                validate_password(password1)
            except ValidationError as e:
                error_messages.extend(e.messages)

            # If any errors exist, return them
            if error_messages:
                return Response(
                    {'errors': error_messages},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the user
            user = get_user_model().objects.create_user(
                email=email,
                password=password1,
                username=email
            )
            user.is_active = False
            user.save()

            # Generate account activation token and link
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(str(user.pk).encode())
            activation_link = f"{
                settings.DJANGO_BACKEND_URL}/activate/{uid}/{token}/"

            # Send email with activation link
            subject = "Activate Your Account"
            html_message = render_to_string(
                'account/email_confirmation.html',
                {
                    'user': user,
                    'activation_url': activation_link,
                    'django_backend_url': settings.DJANGO_BACKEND_URL,
                }
            )

            email_message = EmailMultiAlternatives(
                subject=subject,
                body="Please activate your account using the link below.",
                from_email=settings.NO_REPLY_EMAIL,
                to=[email]
            )
            email_message.attach_alternative(html_message, "text/html")
            email_message.send()

            return Response(
                {'message': 'Verification email sent.'},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e), 'details': 'An unexpected error occurred.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
            f"{settings.DJANGO_BACKEND_URL}/#/"
            f"?uid={uid}&token={token}/"
        )

        # Send the password reset email
        subject = "Password Reset"
        html_message = render_to_string('account/password_reset_email.html', {
            'user': user,
            'reset_password_url': reset_password_link,
            'django_backend_url': settings.DJANGO_BACKEND_URL,
        })

        email_message = EmailMultiAlternatives(
            subject=subject,
            body="Please reset your password using the link below.",
            from_email=settings.NO_REPLY_EMAIL,
            to=[email]
        )
        email_message.attach_alternative(html_message, "text/html")
        email_message.send()

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
