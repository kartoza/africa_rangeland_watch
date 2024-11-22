# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Layer APIs
"""

from django.core.files.storage import FileSystemStorage
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from cloud_native_gis.models import Layer, LayerUpload

from layers.models import InputLayer, DataProvider, LayerGroupType
from frontend.serializers.layers import LayerSerializer
from frontend.tasks import import_layer, detect_file_type_by_extension


class LayerAPI(APIView):
    """API to return list of Layer."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Fetch list of Layer."""
        layers = InputLayer.objects.exclude(
            group__name='user-defined'
        ).exclude(
            url__isnull=True
        )
        if self.request.user.is_authenticated:
            layers = layers.union(
                InputLayer.objects.filter(
                    group__name='user-defined',
                    created_by=request.user
                ).exclude(
                    url__isnull=True
                )
            )
        return Response(
            status=200,
            data=LayerSerializer(
                layers,
                many=True
            ).data
        )


class UploadLayerAPI(APIView):
    """API to upload a layer."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Post file."""
        # create layer
        layer = Layer.objects.create(
            created_by=request.user
        )
        # create InputLayer
        input_layer = InputLayer.objects.create(
            uuid=layer.unique_id,
            name=str(layer.unique_id),
            data_provider=DataProvider.objects.get(name='User defined'),
            group=LayerGroupType.objects.get(name='user-defined'),
            created_by=request.user,
            updated_by=request.user
        )

        file_url = request.data.get('file_url', None)

        instance = LayerUpload(
            created_by=request.user, layer=layer
        )
        instance.emptying_folder()

        # Save files
        if request.FILES:
            file = request.FILES['file']
            FileSystemStorage(
                location=instance.folder
            ).save(file.name, file)
            input_layer.name = file.name
            input_layer.layer_type = detect_file_type_by_extension(
                file.name
            )
            input_layer.save()
        instance.save()

        # trigger task import the layer
        import_layer.delay(layer.unique_id, file_url)
        
        return Response(
            status=200,
            data={
                'id': str(layer.unique_id)
            }
        )
