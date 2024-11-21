from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import OrganisationInviteForm
from .models import Organisation
from django.http import JsonResponse


@login_required
def delete_organisation_member(request, organisation_id, user_id):
    """
    View to remove a member from an organization by clearing the
    `organisation` field in UserProfile.
    """
    try:
        organisation = get_object_or_404(Organisation, id=organisation_id)
        user_profile = get_object_or_404(UserProfile, id=user_id)

        # Check if the current user has the right to delete members
        if request.user.profile.user_type != "organisation_manager":
            return JsonResponse(
                {"error": "You don't have permission to remove members."},
                status=403
            )

        # Check if the user is part of the specified organization
        if user_profile.organisation != organisation:
            return JsonResponse(
                {"error": "User is not a member of this organization."},
                status=400
            )

        # Remove the user from the organization
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

            # Fetch invitations only if the user is a manager
            invitations = []
            if user_profile.user_type == "organisation_manager":
                invitations = list(
                    org.invitations.values("email", "accepted")
                )

            # Add organization data to the response
            data[org.name] = {
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
            form.send_invitation(
                request=request,
                inviter=request.user,
                organisation=organisation)
            return redirect(
                'organisation_detail',
                organisation_id=organisation.id)
    else:
        form = OrganisationInviteForm()
    return render(
        request,
        'invite_to_organization.html',
        {'form': form, 'organisation': organisation})


@login_required
def organisation_detail(request, organisation_id):
    """View to display the details of an organisation."""
    organisation = get_object_or_404(Organisation, id=organisation_id)
    return render(request,
                  'organisation_detail.html',
                  {'organisation': organisation})
