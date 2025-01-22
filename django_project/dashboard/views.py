from base.models import Organisation
from analysis.models import UserAnalysisResults
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Dashboard
from .serializers import DashboardSerializer
from django.db import models
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User


class DashboardListCreateView(generics.ListCreateAPIView):
    """
    View for listing all dashboards or creating a new dashboard.
    """
    queryset = Dashboard.objects.all()
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Filter based on privacy types
        return Dashboard.objects.filter(
            models.Q(privacy_type='public') |
            models.Q(
                privacy_type='organisation',
                organisations__in=user.profile.organisations.all()
            ) |
            models.Q(privacy_type='restricted', users=user) |
            models.Q(created_by=user)
        ).distinct()

    def perform_create(self, serializer):
        # Extract data from the request
        data = self.request.data
        dashboard_name = data.get("config", {}).get("dashboardName")
        preference = data.get("config", {}).get("preference")
        chart_type = data.get("config", {}).get("chartType")
        privacy_type = data.get("privacy_type")
        organisation_names = data.get("organisations", [])

        # Save the dashboard instance with basic fields
        dashboard = serializer.save(
            created_by=self.request.user,
            title=dashboard_name,
            config={
                "dashboardName": dashboard_name,
                "preference": preference,
                "chartType": chart_type,
            },
            privacy_type=privacy_type,
        )

        # Handle organisation and user associations based on privacy_type
        if privacy_type == "organisation":
            if organisation_names:
                for organisation_name in organisation_names:
                    try:
                        organisation = Organisation.objects.get(
                            name=organisation_name
                        )
                        organisation_users = User.objects.filter(
                            profile__organisations=organisation
                        )
                        dashboard.organisations.add(organisation)
                        dashboard.users.add(*organisation_users)
                    except Organisation.DoesNotExist:
                        raise ValidationError(
                            {
                                "organisations":
                                "Selected organisation does not exist."
                            }
                        )
            else:
                user_organisations = (
                    self.request.user.profile.organisations.all()
                )
                if user_organisations:
                    dashboard.organisations.add(*user_organisations)
                    users_to_add = User.objects.filter(
                        profile__organisations__in=user_organisations
                    )
                    dashboard.users.add(*users_to_add)
                else:
                    raise ValidationError(
                        {
                            "organisations":
                            "No valid organisation found for the user."
                        }
                    )

        elif privacy_type == "public":
            all_users = User.objects.all()
            dashboard.users.add(*all_users)

        analysis_results = data.get("analysis_results", [])
        if analysis_results:
            for analysis_id in analysis_results:
                try:
                    analysis_result = UserAnalysisResults.objects.get(
                        id=analysis_id
                    )
                    dashboard.analysis_results.add(analysis_result)
                except UserAnalysisResults.DoesNotExist:
                    raise ValidationError(
                        {
                            "analysis_results":
                            f"Analysis result {analysis_id} does not exist."
                        }
                    )
        dashboard.save()


class DashboardRetrieveUpdateDestroyView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    View for retrieving, updating, or deleting a specific dashboard.
    """
    queryset = Dashboard.objects.all()
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Filter dashboards based on privacy type
        return Dashboard.objects.filter(
            models.Q(privacy_type="public") |
            models.Q(
                privacy_type="organisation",
                organisations__in=user.profile.organisations.all()
            ) |
            models.Q(privacy_type="restricted", users=user) |
            models.Q(created_by=user)
        ).distinct()


class DashboardShareView(APIView):
    """
    View for sharing a dashboard with specific users or groups.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        dashboard_id = kwargs.get('pk')
        dashboard = Dashboard.objects.filter(
            uuid=dashboard_id
        ).first()

        if not dashboard:
            return Response(
                {
                    "error": "Dashboard not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if dashboard.created_by != request.user:
            return Response(
                {
                    "error": "You do not have permission to share this"
                    " dashboard."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        users = request.data.get('users', [])
        groups = request.data.get('groups', [])

        # Add users and groups to the dashboard
        dashboard.users.add(*users)
        dashboard.groups.add(*groups)
        dashboard.save()

        return Response(
            {
                "message": "Dashboard shared successfully."
            },
            status=status.HTTP_200_OK
        )
