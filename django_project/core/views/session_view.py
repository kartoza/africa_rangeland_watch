from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import UserSession
from core.serializers import UserSessionSerializer


class UserSessionViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request):
        # Fetch user's last session data
        session, _ = UserSession.objects.get_or_create(user=request.user)
        serializer = UserSessionSerializer(session)
        return Response(serializer.data)

    def update(self, request):
        # Update session data
        session, _ = UserSession.objects.get_or_create(user=request.user)
        serializer = UserSessionSerializer(
            instance=session,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Session updated successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
