from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required

from .forms import OrganisationInviteForm
from .models import (
    Organisation,
    UserProfile
)
from django.http import JsonResponse
import json
from invitations.utils import get_invitation_model
from django.views.decorators.csrf import csrf_exempt

Invitation = get_invitation_model()




@csrf_exempt
@login_required
def delete_organisation_member(request):
    """
    View to remove a member from an organization by clearing the
    `organisation` field in UserProfile.
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

        if request.user.profile.user_type != "organisation_manager":
            return JsonResponse(
                {"error": "You don't have permission to remove members."},
                status=403
            )
        if user_profile.organisation != organisation:
            return JsonResponse(
                {"error": "User is not a member of this organization."},
                status=400
            )

        user_profile.organisation = None
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
        user_profile = request.user.profile

        # Fetch all organizations the user belongs to
        organisations = Organisation.objects.filter(members=user_profile)

        if not organisations.exists():
            return JsonResponse(
                {"error": "User is not part of any organizations."},
                status=403
            )

        data = {}
        for org in organisations:
            members = list(
                org.members.exclude(user=request.user).values(
                    "user__email", "user_role"
                )
            )

            invitations = []
            invitations = list(
                org.custom_invitations.values("email", "accepted")
            )

            data[org.name] = {
                "org_id": org.id,
                "members": members,
                "invitations": invitations,
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
    organisation = Organisation.objects.get(id=organisation_id)
    if request.method == 'POST':
        form = OrganisationInviteForm(request.POST)
        if form.is_valid():
            message = request.POST.get('message', '')

            # Send the invitation
            form.send_invitation(
                request=request,
                inviter=request.user,
                organisation=organisation,
                message=message
            )
            return JsonResponse({"success": True}, status=200)
    else:
        form = OrganisationInviteForm()
    return JsonResponse({"error": "Invalid request"}, status=400)




@login_required
def organisation_detail(request, organisation_id):
    """View to display the details of an organisation."""
    organisation = get_object_or_404(Organisation, id=organisation_id)
    return render(request,
                  'organisation_detail.html',
                  {'organisation': organisation})
