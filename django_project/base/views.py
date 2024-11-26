from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import OrganisationInviteForm
from .models import (
    Organisation,
    OrganisationInvitation,
    UserProfile
)
from django.http import JsonResponse
import json
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


@login_required
def fetch_organisations(request):
    organisations = Organisation.objects.values("id", "name")
    return JsonResponse(list(organisations), safe=False)


@login_required
def join_organisation(request):
    """
    Handles requests to join an organisation. Sends an email notification
    to the manager of the organisation for approval.
    """
    data = json.loads(request.body)

    try:
        # Convert the selectedOrganisationId to an integer
        selected_org_id = int(data["selectedOrganisationId"])

        # Attempt to get the Organisation by ID
        selected_org = Organisation.objects.get(id=selected_org_id)
    except ValueError:
        return JsonResponse(
            {"error": "Invalid organisation ID format."},
            status=400
        )
    except Organisation.DoesNotExist:
        return JsonResponse(
            {"error": "Organisation does not exist."},
            status=400
        )

    # Find a manager of the selected organisation
    try:
        manager_profile = UserProfile.objects.get(
            organisation=selected_org,
            user_type="organisation_manager"
        )
        manager_user = manager_profile.user
    except UserProfile.DoesNotExist:
        return JsonResponse(
            {"error": "No manager found for this organisation."},
            status=400
        )

    # Manager's email
    manager_email = manager_user.email

    link = f"{settings.DJANGO_BACKEND_URL}admin/base/organisationinvitation/" \
           f"{selected_org.id}/change/"

    # Render the email content
    email_body = render_to_string(
        "join_organization_request.html",
        {
            "user": request.user,
            "organisation": selected_org.name,
            "link": link
        },
    )

    # Send the email to the manager
    try:
        send_mail(
            subject="Request to join organisation",
            message=email_body,
            from_email=settings.NO_REPLY_EMAIL,
            recipient_list=[manager_email],
        )
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to send email: {str(e)}"},
            status=500
        )

    # Create an OrganisationInvitation object for tracking the request
    try:
        OrganisationInvitation.objects.create(
            inviter=request.user,
            email=request.user.email,
            organisation=selected_org,
            request_type="join_organisation"
        )
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to create invitation: {str(e)}"},
            status=500
        )

    return JsonResponse({"message": "Request sent successfully!"})



@login_required
def add_organisation(request):
    """
    Handles requests to add a new organisation. Sends an email notification
    to the admin for approval.
    """
    data = json.loads(request.body)

    OrganisationInvitation.objects.create(
        inviter=request.user,
        email=data.get("organisationEmail", ""),
        request_type="add_organisation",
        organisation=None,
        metadata=json.dumps(
            {
                "organisationName": data.get("organisationName", ""),
                "industry": data.get("industry", ""),
                "requester": {
                    "first_name": data.get("firstName", ""),
                    "last_name": data.get("lastName", ""),
                },
            }
        ),
    )

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

    # Send the email
    send_mail(
        subject="New Organisation Request",
        message="",
        html_message=email_body,
        from_email=settings.NO_REPLY_EMAIL,
        recipient_list=[admin_email],
    )

    return JsonResponse({"message": "Request sent successfully!"})


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
