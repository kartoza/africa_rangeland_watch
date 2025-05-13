from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Organisation,
    OrganisationInvitationDetail,
    UserProfile,
    OrganisationInvitation,
    UserOrganisations
)
from django.conf import settings
from django.template.loader import render_to_string
import json
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import get_object_or_404
from django.contrib import messages


def update_invite(modeladmin, request, invitation):
    try:
        invitation_detail = OrganisationInvitationDetail.objects.get(
            invitation=invitation,
            organisation=invitation.organisation
        )
        invitation_detail.accepted = True
        invitation_detail.organisation = invitation.organisation
        invitation_detail.save()
    except OrganisationInvitationDetail.DoesNotExist:
        modeladmin.message_user(
            request,
            "OrganisationInvitationDetail not found for this request.",
            level="error"
        )
        return


def send_organisation_creation_email(inviter, organisation):
    """
    Sends an email to the inviter notifying them about the
    creation of a new organisation
    and their role as the manager.
    """
    email_body = render_to_string(
        "organization_manager_notification.html",
        {
            "user": inviter,
            "organisation": organisation,
            "support_email": "support@kartoza.com",
            "platform_url": settings.DJANGO_BACKEND_URL,
        },
    )

    try:
        email = EmailMultiAlternatives(
            subject="Your Role as Organisation Manager",
            body="",
            from_email=settings.NO_REPLY_EMAIL,
            to=[inviter.email],
        )
        email.attach_alternative(email_body, "text/html")
        email.send()
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")


def send_join_acceptance_email(inviter, organisation):
    """
    Sends an email to the inviter notifying them that their
    join request has been accepted
    and the user has been added as a member.
    """
    email_body = render_to_string(
        "accepted_organization_request.html",
        {
            "user": inviter,
            "organisation": organisation,
            "link": settings.DJANGO_BACKEND_URL,
        },
    )

    try:
        email = EmailMultiAlternatives(
            subject="Your Join Request Has Been Approved",
            body="",
            from_email=settings.NO_REPLY_EMAIL,
            to=[inviter.email],
        )
        email.attach_alternative(email_body, "text/html")
        email.send()
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")


@admin.action(description="Approve selected join/add requests")
def approve_join_request(modeladmin, request, queryset):
    """
    Admin action to approve join/add requests.
    Creates organisations for 'add_organisation' requests and assigns roles.
    """
    # Check if there is a superuser
    if not User.objects.filter(is_superuser=True).exists():
        modeladmin.message_user(
            request,
            "No admin user found to process the request.",
            level=messages.ERROR
        )
        return

    for invitation in queryset:
        try:
            # Get the related OrganisationInvitationDetail
            try:
                invitation_instance = OrganisationInvitation.objects.get(
                    email=invitation
                )
            except OrganisationInvitation.DoesNotExist:
                try:
                    invitation_instance = OrganisationInvitation.objects.get(
                        invitation_ptr=invitation
                    )
                except OrganisationInvitation.DoesNotExist:
                    invitation_instance = None


            invitation_detail = OrganisationInvitationDetail.objects.filter(
                invitation=invitation_instance).first()

            if invitation_detail is None:
                modeladmin.message_user(
                    request,
                    f"OrganisationInvitationDetail not found: {invitation.id}",
                    level=messages.ERROR
                )
                continue

            if invitation_detail.request_type == "add_organisation":
                # Parse metadata from the invitation
                metadata = json.loads(invitation_detail.metadata or "{}")
                organisation_name = metadata.get("organisationName", "")

                if not organisation_name:
                    modeladmin.message_user(
                        request,
                        "Organisation name missing from metadata.",
                        level=messages.ERROR
                    )
                    continue

                # Create the organisation
                organisation = Organisation.objects.create(
                    name=organisation_name
                )

                # Assign the inviter as the organisation manager
                inviter = invitation_instance.inviter
                user_profile = get_object_or_404(UserProfile, user=inviter)

                # Create UserOrganisations
                UserOrganisations.objects.create(
                    user_profile=user_profile,
                    organisation=organisation,
                    user_type='manager'
                )

                # Update invitation status
                update_invite(modeladmin, request, invitation_instance)

                # Send the email (optional, catch any errors here)
                try:
                    send_organisation_creation_email(inviter, organisation)
                except Exception as e:
                    modeladmin.message_user(
                        request,
                        f"Failed to send email: {str(e)}",
                        level=messages.ERROR
                    )

                modeladmin.message_user(
                    request,
                    f"Organisation '{organisation.name}' created and "
                    f"request approved.",
                    level=messages.SUCCESS
                )

            elif invitation_detail.request_type == "join_organisation":
                # Process join requests
                inviter_email = invitation_instance.email
                inviter_user = get_object_or_404(User, email=inviter_email)
                user_profile = get_object_or_404(
                    UserProfile,
                    user=inviter_user
                )
                organisation = invitation.organisation

                # Create UserOrganisations
                UserOrganisations.objects.create(
                    user_profile=user_profile,
                    organisation=organisation,
                    user_type='member'
                )

                update_invite(modeladmin, request, invitation_instance)

                # Send the acceptance email (optional, catch any errors here)
                try:
                    send_join_acceptance_email(
                        invitation_instance.inviter,
                        organisation
                    )
                except Exception as e:
                    modeladmin.message_user(
                        request,
                        f"Failed to send email: {str(e)}",
                        level=messages.ERROR
                    )

                modeladmin.message_user(
                    request,
                    "Individual has been added.",
                    level=messages.SUCCESS
                )

        except Exception as e:
            modeladmin.message_user(
                request,
                f"An error occurred while processing the request: {str(e)}",
                level=messages.ERROR
            )


@admin.register(OrganisationInvitationDetail)
class OrganisationInvitationDetailAdmin(admin.ModelAdmin):
    list_display = (
        'invitation',
        'organisation',
        'accepted',
        'request_type'
    )
    actions = [approve_join_request]
    list_filter = ('organisation', 'accepted', 'request_type')
    search_fields = ('invitation__email', 'organisation__name')


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "User Profile"
    fk_name = "user"
    fields = (
        'country',
        'created_at', 'updated_at', 'organisations_list',
        'profile_image'
    )
    readonly_fields = ('created_at', 'updated_at', 'organisations_list')

    def organisations_list(self, obj):
        """
        Custom method to display the organisations and roles associated with
        the user.
        """
        orgs_with_roles = UserOrganisations.objects.filter(
            user_profile=obj.user)
        return ", ".join(
            [
                f"{org.organisation.name} - {org.user_type}"
                for org in orgs_with_roles
            ]
        )

    organisations_list.short_description = "Organisations & Roles"


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

    list_display = ('username', 'email', 'first_name', 'last_name',
                    'is_staff', 'get_user_role')
    list_select_related = ('profile',)
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def get_user_role(self, instance):
        """Return user role."""
        return instance.profile.user_role

    get_user_role.short_description = 'User Role'

    def get_inline_instances(self, request, obj=None):
        """Return inline instances."""
        if not obj:
            return []
        return super(UserAdmin, self).get_inline_instances(request, obj)


class UserOrganisationsAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'organisation', 'user_type')
    search_fields = ('user_profile__user__username', 'organisation__name')
    list_filter = ('user_type', 'organisation')
    raw_id_fields = ('organisation',)
    # autocomplete_fields = ('organisation',)

    def get_queryset(self, request):
        return super().get_queryset(request)


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')


admin.site.register(UserOrganisations, UserOrganisationsAdmin)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.unregister(OrganisationInvitation)


@admin.register(OrganisationInvitation)
class OrganisationInvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "organisation", "inviter", "key", "created")
    readonly_fields = ("key",)

    def save_model(self, request, obj, form, change):
        # Save as usual
        super().save_model(request, obj, form, change)

        # Only send on creation (not update)
        if not change:
            try:
                obj.send_invitation(
                    request=request,
                    custom_message=(
                        "You've been invited to join an organisation.",
                    )
                )
                self.message_user(
                    request,
                    "Invitation email sent successfully.",
                    level=messages.SUCCESS,
                )
            except Exception as e:
                self.message_user(
                    request, f"Failed to send email: {str(e)}",
                    level=messages.ERROR
                )
