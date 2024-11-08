from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import OrganisationInviteForm
from .models import Organisation


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
