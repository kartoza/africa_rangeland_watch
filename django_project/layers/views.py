import os
import tempfile
import logging
import mimetypes
from collections import defaultdict
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import render  # noqa: F401
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404

from cloud_native_gis.models import Layer
from analysis.utils import _initialize_gdrive_instance
from .models import InputLayer, ExportedCog
from .tasks.export_nrt_cog import export_ee_image_to_cog_task


logger = logging.getLogger(__name__)


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
            "url": layer.url,
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


@api_view(['POST'])
@login_required
def trigger_cog_export(request, uuid):
    landscape_id = request.data.get("landscape_id")
    if not landscape_id:
        return Response({"error": "landscape_id is required"}, status=400)

    try:
        layer = get_object_or_404(InputLayer, uuid=uuid)
        export_ee_image_to_cog_task.delay(str(layer.uuid), landscape_id)
        return Response({"message": "Export task triggered."})
    except Exception as ex:
        logger.error(f"Export failed {ex}", exc_info=True)
        return Response({"error": "An internal error occurred."}, status=500)


@api_view(['GET'])
@login_required
def download_from_gdrive(request, uuid):
    """
    Streams a downloaded COG file directly from Google Drive
    using the stored gdrive_file_id from ExportedCog.
    """
    try:
        input_layer = InputLayer.objects.get(uuid=uuid)
        exported = ExportedCog.objects.filter(
            input_layer=input_layer,
            downloaded=True
        ).first()

        if not exported or not exported.gdrive_file_id:
            raise Http404("No exported file found.")

        gdrive = _initialize_gdrive_instance()
        gfile = gdrive.CreateFile({'id': exported.gdrive_file_id})

        # Create a temporary file and download the GDrive content into it
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            gfile.GetContentFile(temp_file.name)
            temp_file_path = temp_file.name

        # Return the temp file as a streamed response
        return FileResponse(
            open(temp_file_path, 'rb'),
            as_attachment=True,
            filename=exported.file_name,
            content_type='application/octet-stream'
        )
    except InputLayer.DoesNotExist:
        raise Http404("Layer not found.")
    except Exception as ex:
        logger.error(f"Download failed: {ex}", exc_info=True)
        raise Http404("Download failed.")
