from django.urls import path
from . import organisation_views, user_profile_views


urlpatterns = [
    path('organisation/<int:organisation_id>/',
         organisation_views.organisation_detail,
         name='organisation_detail'),
    path('api/organizations',
         organisation_views.fetch_organisation_data,
         name='fetch_organisation_data'),
    path(
        'api/organizations/member/delete/',
        organisation_views.delete_organisation_member,
        name='delete_member'),
    path(
        'api/organization/<int:organisation_id>/invite/',
        organisation_views.invite_to_organisation,
        name='invite_to_organisation'),
    path(
        'organisation/invite/accept/<int:invitation_id>/',
        organisation_views.accept_invite,
        name='organisation-invite-accept'
    ),
    path(
        'api/join-organization/',
        organisation_views.join_organisation,
        name='join_organization'
    ),
    path(
        'api/add-organization/',
        organisation_views.add_organisation,
        name='add_organization'
    ),
    path(
        'api/fetch-organizations/',
        organisation_views.fetch_organisations,
        name='fetch_organization'
    ),
    path(
        'api/profile/',
        user_profile_views.get_user_profile,
        name='get_user_profile'
    ),
    path(
        'api/profile/update/',
        user_profile_views.update_user_profile,
        name='update_user_profile'
    ),
    path(
        'api/profile/image/',
        user_profile_views.ProfileImageUploadView.as_view(),
        name='profile-image-upload'
    ),
]
