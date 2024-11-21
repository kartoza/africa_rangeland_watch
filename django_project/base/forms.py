from django import forms
from invitations.utils import get_invitation_model

Invitation = get_invitation_model()



class OrganisationInviteForm(forms.Form):
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

            # Send the invitation with a custom template
            invitation.send_invitation(
                request=request,
                custom_message=message
            )
