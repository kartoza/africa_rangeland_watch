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
import json
from django.db.models import Q
import logging
from django.shortcuts import get_object_or_404


logger = logging.getLogger(__name__)


class DashboardOwnerListView(generics.ListAPIView):
    """
    View to list unique dashboard owners.
    """
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Get the distinct users who created the dashboards
        return User.objects.filter(
            created_dashboards__isnull=False
        ).distinct()

    def list(self, request, *args, **kwargs):
        # Fetch the owners
        queryset = self.get_queryset()
        owners = [
            {
                'id': user.id,
                'username': user.username
            } for user in queryset
        ]
        return Response(owners)


class DashboardListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating dashboards.
    """
    serializer_class = DashboardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Dashboard.objects.all()

        # Public dashboards for unauthenticated users
        if not user.is_authenticated:
            queryset = (
                Dashboard.objects.filter(privacy_type='public').distinct()
            )
        else:
            queryset = queryset.filter(
                Q(privacy_type='public') |
                Q(users=user) |
                Q(
                    privacy_type='organisation',
                    organisations__in=user.profile.organisations.all()
                ) |
                Q(created_by=user)
            ).distinct()

        # Get filter parameters
        filters = self.request.query_params

        search_term = filters.get('searchTerm')
        category = filters.get('category')
        keyword = filters.get('keyword')
        region = filters.get('region')
        owner = filters.get('owner')
        my_organisations = filters.get('my_organisations') == 'true'
        my_dashboards = filters.get('my_dashboards') == 'true'
        maps = filters.get('maps') == 'true'
        region = filters.get('region')

        if region:
            # Parse region from stringified JSON
            region_data = json.loads(region)
            latitude = region_data.get('lat')
            longitude = region_data.get('lng')

            if latitude and longitude:
                queryset = queryset.filter(
                    analysis_results__data__latitude=latitude,
                    analysis_results__data__longitude=longitude
                )

        # Apply text-based filters
        if search_term:
            queryset = queryset.filter(title__icontains=search_term)
        if category:
            queryset = queryset.filter(config__dashboardName=category)
        if keyword:
            queryset = queryset.filter(config__preference=keyword)
        if region:
            queryset = queryset.filter(config__chartType=region)
        if owner:
            queryset = queryset.filter(created_by__username=owner)

        # Apply boolean filters (handling combinations)
        if my_organisations:
            queryset = queryset.filter(
                organisations__in=user.profile.organisations.all()
            )
        if my_dashboards:
            queryset = queryset.filter(created_by=user)
        if maps:
            queryset = queryset.filter(config__preference='map')

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
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
                                    "Organisation does not exist."
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
            logger.exception(str(e))
            return Response(
                {"error": True, "message": "An internal error has occurred."},
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


class UpdateDashboardView(APIView):
    """
    Manually updates specific fields of a dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, uuid):
        dashboard = get_object_or_404(Dashboard, uuid=uuid)

        # Check if the request user is the owner of the dashboard
        if dashboard.created_by != request.user:
            return Response(
                {
                    "error":
                    "You do not have permission to update this dashboard."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Extract fields from request data
        title = request.data.get("title", dashboard.title)
        privacy_type = request.data.get("privacy_type", dashboard.privacy_type)
        analysis_results = request.data.get("analysis_results", None)
        config = request.data.get("config", dashboard.config)

        # Update fields
        dashboard.title = title
        dashboard.privacy_type = privacy_type

        # Handle analysis_results (ManyToManyField)
        if analysis_results is not None:
            dashboard.analysis_results.set(analysis_results)

        # Handle config (JSONField)
        dashboard.config = (
            config if isinstance(config, dict) else dashboard.config
        )

        # Save the changes
        dashboard.save()

        return Response(
            {
                "message": "Dashboard updated successfully"
            },
            status=status.HTTP_200_OK
        )
