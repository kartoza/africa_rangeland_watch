from base.models import Organisation, UserOrganisations
from analysis.models import UserAnalysisResults
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Dashboard
from .serializers import DashboardSerializer
from django.db import models
from django.contrib.auth.models import User
from rest_framework.permissions import (
    IsAuthenticated,
    IsAuthenticatedOrReadOnly
)


class DashboardListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating dashboards.
    """
    queryset = Dashboard.objects.all()
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Dashboard.objects.filter(privacy_type='public').distinct()

        # If the user is authenticated, filter
        # dashboards based on their permissions
        dashboards = Dashboard.objects.filter(
            models.Q(privacy_type='public') |
            models.Q(users=user) |
            models.Q(
                privacy_type='organisation',
                organisations__in=user.profile.organisations.all()
            ) |
            models.Q(created_by=user)
        ).distinct()

        return dashboards

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Serialize the queryset
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)



class DashboardCreateView(APIView):
    """
    View for creating a new dashboard.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # Extract data from the request
            data = request.data
            dashboard_name = data.get("config", {}).get("dashboardName")
            preference = data.get("config", {}).get("preference")
            chart_type = data.get("config", {}).get("chartType")
            privacy_type = data.get("privacy_type")
            organisation_names = data.get("organisations", [])

            dashboard = Dashboard(
                created_by=request.user,
                title=dashboard_name,
                config={
                    "dashboardName": dashboard_name,
                    "preference": preference,
                    "chartType": chart_type,
                },
                privacy_type=privacy_type,
            )

            dashboard.save()

            # Handle organisation and
            # user associations based on privacy_type
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
                            return Response(
                                {
                                    "error": True,
                                    "message":
                                    f"Organisation does not exist."
                                },
                                status=status.HTTP_400_BAD_REQUEST
                            )
                else:
                    user_organisations = (
                        request.user.profile.organisations.all()
                    )
                    if user_organisations:
                        dashboard.organisations.add(*user_organisations)
                        users_to_add = User.objects.filter(
                            profile__organisations__in=user_organisations
                        )
                        dashboard.users.add(*users_to_add)
                    else:
                        return Response(
                            {
                                "error": True,
                                "message":
                                "No valid organisation found for the user."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

            elif privacy_type == "public":
                all_users = User.objects.all()
                dashboard.users.add(*all_users)

            elif privacy_type == "restricted":
                user_organisations = (
                    request.user.profile.organisations.all()
                )
                if user_organisations:
                    dashboard.organisations.add(*user_organisations)
                    users_to_add = User.objects.filter(
                        profile__organisations__in=user_organisations
                    )
                    dashboard.users.add(*users_to_add)
                else:
                    return Response(
                        {
                            "error": True,
                            "message":
                            "No valid organisation found for the user."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Handle analysis results
            analysis_results = data.get("analysis_results", [])
            if analysis_results:
                for analysis_id in analysis_results:
                    try:
                        analysis_result = UserAnalysisResults.objects.get(
                            id=analysis_id
                        )
                        dashboard.analysis_results.add(analysis_result)
                    except UserAnalysisResults.DoesNotExist:
                        return Response(
                            {
                                "error": True,
                                "message":
                                f"Analysis {analysis_id} does not exist."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

            dashboard.save()
            return Response(
                {
                    "message":
                    "Dashboard created successfully",
                    "dashboard_id": dashboard.pk
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": True, "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )




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

        return Dashboard.objects.filter(
            models.Q(privacy_type="public") |
            models.Q(
                privacy_type="organisation",
                organisations__in=user.profile.organisations.all()
            ) |
            models.Q(privacy_type="restricted", users=user) |
            models.Q(created_by=user)
        ).distinct()

    def destroy(self, request, *args, **kwargs):
        dashboard = self.get_object()
        user = request.user

        if dashboard.created_by == user:
            return super().destroy(request, *args, **kwargs)

        user_org_relationships = UserOrganisations.objects.filter(
            user_profile=user.profile,
            organisation__in=dashboard.organisations.all(),
            user_type='manager'
        )

        if user_org_relationships.exists():
            return super().destroy(request, *args, **kwargs)

        # If neither condition is met, deny the request
        return Response(
            {
                "detail":
                "You do not have permission to delete this dashboard."
            },
            status=status.HTTP_403_FORBIDDEN,
        )



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
