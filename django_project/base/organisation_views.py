from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required

from .forms import OrganisationInviteForm
from .models import (
    Organisation,
    OrganisationInvitation,
    UserProfile,
    UserOrganisations,
    OrganisationInvitationDetail
)
from django.http import JsonResponse
import json
from invitations.utils import get_invitation_model
from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth.models import User
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.db import IntegrityError


Invitation = get_invitation_model()



@login_required
def fetch_organisations(request):
    organisations = Organisation.objects.values("id", "name")
    return JsonResponse(list(organisations), safe=False)




@login_required
def join_organisation(request):
    data = json.loads(request.body)

    try:
        selected_org_id = int(data["selectedOrganisationId"])
        selected_org = Organisation.objects.get(id=selected_org_id)
    except (ValueError, Organisation.DoesNotExist):
        return JsonResponse(
            {"message": "Invalid organisation ID."}, status=400
        )

    try:
        user_organisation = UserOrganisations.objects.get(
            organisation=selected_org, user_type="manager"
        )
        manager_user = user_organisation.user_profile.user
    except UserOrganisations.DoesNotExist:
        return JsonResponse(
            {"message": "No manager found for this organisation."},
            status=400
        )

    # Check for an existing invitation
    existing_invitation = OrganisationInvitation.objects.filter(
        email=request.user.email
    ).first()

    if existing_invitation:
        if not existing_invitation.organisation:
            # Update the invitation if organisation is None
            existing_invitation.organisation = selected_org
            existing_invitation.save()

        # Check if already linked to the selected organization
        if OrganisationInvitationDetail.objects.filter(
            invitation=existing_invitation, organisation=selected_org
        ).exists():
            return JsonResponse(
                {
                    "message":
                    "You have already requested to join this organisation."
                },
                status=400
            )

        # Add a new detail to link the invitation to this organization
        OrganisationInvitationDetail.objects.create(
            invitation=existing_invitation,
            organisation=selected_org,
            request_type="join_organisation"
        )
    else:
        # If no existing invitation, create a new one
        try:
            new_invitation = OrganisationInvitation.objects.create(
                inviter=request.user,
                email=request.user.email,
                organisation=selected_org,
            )
            OrganisationInvitationDetail.objects.create(
                invitation=new_invitation,
                organisation=selected_org,
                request_type="join_organisation"
            )
        except IntegrityError as e:
            return JsonResponse(
                {"error": f"Failed to create invitation: {str(e)}"},
                status=500
            )

    manager_email = manager_user.email
    link = (
        f"{settings.DJANGO_BACKEND_URL}/admin/base/organisationinvitation/"
    )
    logo_url = f"{settings.DJANGO_BACKEND_URL}/static/images/main_logo.svg"
    email_body = render_to_string(
        "join_organization_request.html",
        {
            "user": request.user,
            "organisation": selected_org.name,
            "link": link,
            "logo_url": logo_url
        },
    )

    # Send the email to the manager
    try:
        email = EmailMultiAlternatives(
            subject="Request to join organisation",
            body="",  # Empty plain text content
            from_email=settings.NO_REPLY_EMAIL,
            to=[manager_email],
        )
        email.attach_alternative(email_body, "text/html")
        email.send()
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to send email: {str(e)}"}, status=500
        )
    return JsonResponse({"message": "Request sent successfully!"})




@login_required
def add_organisation(request):
    """
    Handles requests to add a new organisation. Sends an email notification
    to the admin for approval.
    """
    data = json.loads(request.body)

    invitation, _ = OrganisationInvitation.objects.get_or_create(
        email=data.get("organisationEmail", ""),
        organisation=None,
        inviter=request.user,
        defaults={
            "inviter": request.user,
            "organisation": None,
        }
    )

    # Fetch or create the OrganisationInvitationDetail
    organisation_invitation_detail, created = (
        OrganisationInvitationDetail.objects.update_or_create(
            invitation=invitation,
            organisation=None,
            defaults={
                "request_type": "add_organisation",
                "metadata": json.dumps(
                    {
                        "organisationName": data.get("organisationName", ""),
                        "industry": data.get("industry", ""),
                        "requester": {
                            "first_name": data.get("firstName", ""),
                            "last_name": data.get("lastName", ""),
                        },
                    }
                ),
                "accepted": False,
            }
        )
    )

    # Handle the response or further logic
    if created:
        # Get the email of the first superuser
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            return JsonResponse(
                {"error": "No admin user found to process the request."},
                status=500,
            )

        admin_email = admin_user.email

        # Render the email content
        email_body = render_to_string(
            "request_to_add_organization.html",
            {
                "requester": {
                    "first_name": data.get("firstName", ""),
                    "last_name": data.get("lastName", ""),
                },
                "organisation": {
                    "name": data.get("organisationName", ""),
                    "email": data.get("organisationEmail", ""),
                    "industry": data.get("industry", ""),
                },
            },
        )

        # Prepare and send the email
        email = EmailMultiAlternatives(
            subject="New Organisation Request",
            body="",
            from_email=settings.NO_REPLY_EMAIL,
            to=[admin_email],
        )
        email.attach_alternative(email_body, "text/html")
        email.send()
        return JsonResponse({"message": "Request sent successfully!"})
    else:
        return JsonResponse(
            {
                "error":
                "You've already sent a request for organisation creation"
            }, status=500
        )



@login_required
def delete_organisation_member(request):
    """
    View to remove a member from an organization by deleting their
    entry in the UserOrganisations model and clearing their association
    with the organisation.
    """
    if request.method != "DELETE":
        return JsonResponse(
            {"error": "Invalid HTTP method. Use DELETE."},
            status=405
        )

    try:
        body = json.loads(request.body)
        organisation_id = body.get("organisation_id")
        user_email = body.get("user_email")

        if not organisation_id or not user_email:
            return JsonResponse(
                {"error": "Organisation ID and User Email are required."},
                status=400
            )

        organisation = get_object_or_404(Organisation, id=organisation_id)
        user_profile = get_object_or_404(UserProfile, user__email=user_email)

        # Check if the request user has permission
        user = request.user
        user_profile_manager = user.profile

        user_organisation_relation = UserOrganisations.objects.filter(
            user_profile=user_profile_manager, organisation=organisation
        ).first()

        if (
            not user_organisation_relation or
            user_organisation_relation.user_type != "manager"
        ):
            return JsonResponse(
                {"error": "You don't have permission to remove members."},
                status=403
            )

        # Find the UserOrganisations relation for the user to be removed
        user_relation = UserOrganisations.objects.filter(
            user_profile=user_profile, organisation=organisation
        ).first()

        if not user_relation:
            return JsonResponse(
                {"error": "User is not a member of this organisation."},
                status=400
            )

        # Delete the user's organisation relation
        user_relation.delete()

        user_profile.save()

        return JsonResponse(
            {"message": "Member removed successfully."},
            status=200
        )

    except Exception as e:
        return JsonResponse(
            {"error": "An error occurred.", "details": str(e)},
            status=500
        )


@login_required
def fetch_organisation_data(request):
    """
    Fetch organization data based on the user's role and type.
    Includes members and invitations at the organization level.
    """
    try:
        user_profile = get_object_or_404(UserProfile, user=request.user)
        user_organisations = UserOrganisations.objects.filter(
            user_profile=user_profile
        )

        if not user_organisations.exists():
            return JsonResponse(
                {"error": "User is not part of any organizations."},
                status=403
            )

        data = {}
        for user_org in user_organisations:
            org = user_org.organisation
            members = list(
                UserOrganisations.objects.filter(organisation=org)
                .exclude(user_profile=user_profile)
                .values("user_profile__user__email", "user_type")
            )


            invitations = list(
                org.custom_invitations.all().values("email", "accepted")
            ) if org.custom_invitations.exists() else []

            # Check if the user is a manager
            is_manager = user_org.user_type == 'manager'


            data[org.name] = {
                "org_id": org.id,
                "members": members,
                "invitations": invitations,
                "is_manager": is_manager
            }

        return JsonResponse(data, status=200)

    except AttributeError as e:
        return JsonResponse(
            {
                "error": "User profile is not set up correctly.",
                "details": str(e)
            },
            status=500
        )
    except Exception as e:
        return JsonResponse(
            {"error": "An unexpected error occurred.", "details": str(e)},
            status=500
        )




@login_required
def invite_to_organisation(request, organisation_id):
    """View to invite a user to an organisation."""
    try:
        # Ensure the organisation exists
        organisation = get_object_or_404(Organisation, id=organisation_id)

        if request.method != 'POST':
            return JsonResponse(
                {"error": "Invalid HTTP method. Use POST."},
                status=405
            )

        # Parse JSON payload
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON payload."}, status=400)

        form = OrganisationInviteForm(data)
        if not form.is_valid():
            return JsonResponse(
                {"error": "Form validation failed", "details": form.errors},
                status=400
            )

        email = form.cleaned_data["email"]
        message = data.get("message", "")

        # Check if the user has permission to invite (using UserOrganisations)
        user_profile = get_object_or_404(UserProfile, user=request.user)
        user_organisation = UserOrganisations.objects.filter(
            user_profile=user_profile,
            organisation=organisation
        ).first()

        if not user_organisation or user_organisation.user_type != 'manager':
            return JsonResponse(
                {"error": "You do not have permission to invite users."},
                status=403
            )

        # Check if an invitation already exists
        invitation = OrganisationInvitation.objects.filter(
            email=email,
            organisation=organisation
        ).first()
        if not invitation:
            invitation = OrganisationInvitation.objects.create(
                email=email,
                inviter=request.user,
                organisation=organisation
            )

            # Send the invitation
            try:
                invitation.send_invitation(
                    request=request,
                    custom_message=message
                )
                return JsonResponse({"success": True}, status=200)
            except Exception as e:
                return JsonResponse(
                    {
                        "error": "Failed to send invitation.",
                        "details": str(e)
                    }, status=500)

    except Organisation.DoesNotExist:
        return JsonResponse({"error": "Organisation not found."}, status=404)
    except Exception as e:
        print(str(e))
        return JsonResponse(
            {
                "error": "An unexpected error occurred",
                "details": str(e)
            }, status=500)





@login_required
def organisation_detail(request, organisation_id):
    """View to display the details of an organisation."""
    organisation = get_object_or_404(Organisation, id=organisation_id)
    return render(request,
                  'organisation_detail.html',
                  {'organisation': organisation})



@login_required
def accept_invite(request, invitation_id):
    invitation = get_object_or_404(OrganisationInvitation, id=invitation_id)

    try:
        user = User.objects.get(email=invitation.email)
        user_profile = get_object_or_404(UserProfile, user=user)
    except User.DoesNotExist:
        return redirect(f"{reverse('home')}?register_first=true")

    user_org = UserOrganisations.objects.filter(
        user_profile=user_profile,
        organisation=invitation.organisation
    ).first()

    if user_org:
        return JsonResponse(
            {
                "error": "You are already a member of this organization."
            },
            status=400
        )

    # Create a new membership for the user in the organisation
    UserOrganisations.objects.create(
        user_profile=user_profile,
        organisation=invitation.organisation,
        user_type='member'
    )


    user_profile.organisations.add(invitation.organisation)
    user_profile.save()

    return redirect(f"{reverse('home')}?invitation_accepted=true")
