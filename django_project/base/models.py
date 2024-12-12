from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from invitations.models import Invitation
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
import uuid
from django.core.mail import EmailMultiAlternatives


class Organisation(models.Model):
    """
    Model to represent an organization that a user can belong to.
    """

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The name of the organization."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Organisation"
        verbose_name_plural = "Organisations"
        ordering = ['name']

    def __str__(self):
        return self.name



class OrganisationInvitation(Invitation):
    REQUEST_TYPE_CHOICES = [
        ('add_organisation', 'Add Organisation'),
        ('join_organisation', 'Join Organisation'),
    ]
    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="custom_invitations",
        null=True,
        blank=True,
    )
    request_type = models.CharField(
        max_length=20,
        choices=REQUEST_TYPE_CHOICES,
        default='add_organisation',
    )
    metadata = models.TextField(
        null=True,
        blank=True,
        help_text="Additional metadata for the request (JSON format).",
    )

    def __str__(self):
        if self.organisation:
            return f"Invitation for {self.email} to join {
                self.organisation.name}"
        return f"Invitation for {self.email}, organisation not yet created"

    def save(self, *args, **kwargs):
        # Ensure a unique key is generated if missing
        if not self.key:
            self.key = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def get_invite_url(self, request):
        return request.build_absolute_uri(
            reverse(
                'organisation-invite-accept',
                kwargs={'invitation_id': self.id}
            )
        )

    def send_invitation(self, request, custom_message):
        """Send email with a custom message and template."""
        context = {
            "invitation": self,
            "custom_message": custom_message,
            "inviter": self.inviter,
            "organisation": self.organisation,
            "accept_url": self.get_invite_url(request),
            "django_backend_url": settings.DJANGO_BACKEND_URL,
        }

        subject = f"You've been invited to join {self.organisation.name}!"
        email_body = render_to_string(
            "invitation_to_join_organization.html", context
        )

        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body="",
                from_email=settings.NO_REPLY_EMAIL,
                to=[self.email],
            )
            email.attach_alternative(email_body, "text/html")
            email.send()
        except Exception as e:
            raise Exception(
                f"Failed to send email to {self.email}: {str(e)}"
            )




class UserProfile(models.Model):
    """
    Extends the built-in User model to add additional information.
    """

    USER_ROLES = [
        ('viewer', 'Viewer'),
        ('analyst', 'Analyst'),
        ('conservationist', 'Conservationist'),
        ('administrator', 'Administrator'),
        ('user', 'User'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
        help_text="The user associated with this profile."
    )

    # Establish many-to-many relationship with UserOrganisations
    organisations = models.ManyToManyField(
        Organisation,
        through='UserOrganisations',
        related_name='user_profiles',
        blank=True,
        help_text="The organisations this user belongs to."
    )

    country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="The country of the user."
    )

    user_role = models.CharField(
        max_length=20,
        choices=USER_ROLES,
        default='viewer',
        help_text="The role of the user in the system."
    )

    is_support_staff = models.BooleanField(
        default=False,
        help_text="Indicates if the user is a support staff member."
    )

    profile_image = models.ImageField(
        upload_to='profile_images/',
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username} Profile"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal to create a UserProfile whenever a new User is created.
    """
    if created:
        user_profile = UserProfile.objects.create(user=instance)

        invitation = OrganisationInvitation.objects.filter(
            email=instance.email).last()

        if invitation:
            organisation = invitation.organisation
            user_profile.organisations.add(organisation)
            user_profile.save()

            # Mark invitation as accepted
            invitation.accepted = True
            invitation.save()


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal to save the UserProfile whenever the User is saved.
    """
    instance.profile.save()


class UserOrganisations(models.Model):
    """
    Model to represent the relationship between a user and
    an organisation with their respective role.
    """
    USER_TYPES = [
        ('manager', 'Manager'),
        ('member', 'Member'),
    ]

    user_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="user_organisations",
        blank=True,
        null=True,
    )

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="user_organisations",
    )

    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPES,
        default='member',
        help_text="The type of the user within the organisation"
        "(manager/member)."
    )

    class Meta:
        unique_together = ('user_profile', 'organisation')

    def __str__(self):
        return f"{self.user_profile.user.username} - " \
            f"{self.organisation.name} ({self.user_type})"
