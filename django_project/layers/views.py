import os
import mimetypes
from collections import defaultdict
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render  # noqa: F401
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from django.shortcuts import get_object_or_404
from django.http import FileResponse

from cloud_native_gis.models import Layer
from .tasks.export_nrt_cog import export_ee_image_to_cog
from .models import InputLayer


@login_required
def user_input_layers(request):
    """
    View to retrieve layers grouped by 'group' field for the current user,
    filtering for layers that belong to the 'user-defined' group.
    """
    user_layers = InputLayer.objects.filter(
        created_by=request.user,
        group__name="user-defined"
    ).select_related('data_provider', 'group')

    # Group layers by 'group' field
    grouped_layers = defaultdict(list)
    for layer in user_layers:
        group_name = layer.group.name if layer.group else "Ungrouped"
        # find corespoinding layer from cloud_native_gis
        gis_layer = Layer.objects.filter(unique_id=layer.uuid).first()
        grouped_layers[group_name].append({
            "uuid": str(layer.uuid),
            "name": layer.name,
            "layer_type": layer.layer_type,
            "data_provider": layer.data_provider.name,
            "created_at": layer.created_at,
            "updated_at": layer.updated_at,
            "layer_id": gis_layer.id if gis_layer else None,
        })

    # Return grouped layers as a JsonResponse
    return JsonResponse({"grouped_layers": grouped_layers})


@login_required
def delete_layer(request, uuid):
    """
    View to delete a user-defined layer by UUID.
    """
    layer = get_object_or_404(InputLayer, uuid=uuid, created_by=request.user)
    layer.delete()
    return JsonResponse({"message": "Layer deleted successfully"}, status=200)


@login_required
def download_layer(request, uuid):
    """
    View to download a user-defined layer file.
    Supports multiple formats: .zip, .geojson, .gpkg, .kml.
    """
    layer = get_object_or_404(InputLayer, uuid=uuid, created_by=request.user)

    if not layer.data_provider or not layer.data_provider.file:
        return JsonResponse(
            {"error": "No file available for this layer"},
            status=400
        )

    file_path = layer.data_provider.file.path
    file_name = os.path.basename(file_path)
    content_type, _ = mimetypes.guess_type(file_path)

    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type or 'application/octet-stream'
    )
    response['Content-Disposition'] = f'attachment; filename="{file_name}"'

    return response


@login_required
@api_view(['POST'])
def trigger_cog_export(request, layer_id):
    """Trigger COG export task for a given NRT InputLayer."""
    try:
        layer = InputLayer.objects.get(uuid=layer_id)
        export_ee_image_to_cog.delay(str(layer.uuid))
        return Response({"message": "Export task triggered."})
    except InputLayer.DoesNotExist:
        return Response({"error": "Layer not found."}, status=404)
