from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.utils import user_email
from django.contrib.auth.models import User


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        Automatically link social account to an existing
        user if the email matches.
        """
        # If already logged in, no action required
        if request.user.is_authenticated:
            return

        # Extract email from social account
        email = user_email(sociallogin.account.user)
        if not email:
            return  # Email is required to proceed

        # Check if a user with this email exists
        try:
            user = self.get_user_by_email(email)
            # Link the existing user with this social account
            sociallogin.connect(request, user)
        except User.DoesNotExist:
            # No user with this email, proceed with the default behavior
            pass

    def get_user_by_email(self, email):
        """
        Get a user by email.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.get(email=email)
