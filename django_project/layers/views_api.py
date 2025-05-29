from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import ExternalLayer
from .serializers import ExternalLayerDetailSerializer


class ExternalLayerViewSet(viewsets.ModelViewSet):
    """
    Allows authenticated users to list and retrieve visible external layers.
    """
    queryset = ExternalLayer.objects.filter(is_public=True)
    serializer_class = ExternalLayerDetailSerializer
    permission_classes = [IsAuthenticated]
