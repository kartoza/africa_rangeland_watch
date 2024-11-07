from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


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


class UserProfile(models.Model):
    """
    Extends the built-in User model to add additional information.
    """

    USER_TYPES = [
        ('organisation_member', 'Organisation Member'),
        ('organisation_manager', 'Organisation Manager'),
    ]

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

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
        help_text="The organization that this user belongs to."
    )

    country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="The country of the user."
    )

    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPES,
        default='member',
        help_text="The type of the user."
    )

    user_role = models.CharField(
        max_length=20,
        choices=USER_ROLES,
        default='viewer',
        help_text="The role of the user in the system."
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
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal to save the UserProfile whenever the User is saved.
    """
    instance.profile.save()