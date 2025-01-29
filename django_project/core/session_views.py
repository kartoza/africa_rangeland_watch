from rest_framework import viewsets
from rest_framework.response import Response
from core.models import UserSession
from core.serializers import UserSessionSerializer
from rest_framework.permissions import IsAuthenticated


class UserSessionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_user_session(self, request):
        try:
            session, created = UserSession.objects.get_or_create(
                user=request.user
            )
        except UserSession.MultipleObjectsReturned:
            session = UserSession.objects.filter(
                user=request.user).last()
            UserSession.objects.exclude(
                id=session.id
            ).delete()
        return session

    def retrieve(self, request):
        serializer = UserSessionSerializer(self.get_user_session(request))
        return Response(serializer.data)

    def update(self, request):
        session = self.get_user_session(request)
        data = request.data
        if 'analysisState' in data:
            session.analysis_state = data.get('analysisState')

        if 'last_page' in data:
            session.last_page = data.get('last_page')

        if 'activity_data' in data:
            # Merge the new activity data with existing data
            existing_activity = session.activity_data or {}
            existing_activity.update(data['activity_data'])
            session.activity_data = existing_activity

        session.save()

        serializer = UserSessionSerializer(session)
        return Response(
            {
                "message": "Session updated successfully.",
                "data": serializer.data
            }
        )
