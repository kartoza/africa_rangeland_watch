from django import forms
from invitations.utils import get_invitation_model

Invitation = get_invitation_model()


class JSONCompatibleForm(forms.Form):
    def __init__(self, *args, **kwargs):
        # Check if JSON data is passed
        if isinstance(args[0], dict):
            args = (args[0],)
        super().__init__(*args, **kwargs)


class OrganisationInviteForm(JSONCompatibleForm):
    email = forms.EmailField()

    def send_invitation(self, request, inviter, organisation, message):
        """Send invitation with a custom email template."""
        email = self.cleaned_data['email']
        invitation = (
            Invitation.objects.filter(
                email__iexact=email
            ).order_by('created').last())


        if invitation is None:
            invitation = Invitation.create(
                email=email,
                inviter=inviter,
                organisation=organisation
            )
            invitation.send_invitation(
                request=request,
                custom_message=message
            )

