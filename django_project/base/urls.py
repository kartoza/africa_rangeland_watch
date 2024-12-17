from django.urls import path
from . import organisation_views


urlpatterns = [
    path('organisation/<int:organisation_id>/',
         views.organisation_detail,
         name='organisation_detail'),
    path('api/organizations',
         views.fetch_organisation_data,
         name='fetch_organisation_data'),
    path(
        'api/organizations/member/delete/',
        views.delete_organisation_member,
        name='delete_member'),
    path(
        'api/organization/<int:organisation_id>/invite/',
        views.invite_to_organisation,
        name='invite_to_organisation'),
    path(
        'organisation/invite/accept/<int:invitation_id>/',
        views.accept_invite,
        name='organisation-invite-accept'
    ),
    path(
        'api/join-organization/',
        views.join_organisation,
        name='join_organization'
    ),
    path(
        'api/add-organization/',
        views.add_organisation,
        name='add_organization'
    ),
    path(
        'api/fetch-organizations/',
        views.fetch_organisations,
        name='fetch_organization'
    ),
]
