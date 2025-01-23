from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Dashboard
from .serializers import DashboardSerializer
from django.db import models


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
        serializer.save(created_by=self.request.user)


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
