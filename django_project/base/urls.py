from django.urls import path
from . import views


urlpatterns = [
    path('organisation/<int:organisation_id>/',
         views.organisation_detail,
         name='organisation_detail'),
    path('organisation/<int:organisation_id>/invite/',
         views.invite_to_organisation,
         name='invite_to_organization'),
]
