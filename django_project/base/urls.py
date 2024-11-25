from django.urls import path
from . import views


urlpatterns = [
    path('organisation/<int:organisation_id>/',
         views.organisation_detail,
         name='organisation_detail'),
    path('organisation/<int:organisation_id>/invite/',
         views.invite_to_organisation,
         name='invite_to_organization'),
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
