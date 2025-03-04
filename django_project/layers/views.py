from collections import defaultdict
from django.shortcuts import render  # noqa: F401
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from .models import InputLayer
from django.shortcuts import get_object_or_404


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
        grouped_layers[group_name].append({
            "uuid": str(layer.uuid),
            "name": layer.name,
            "layer_type": layer.layer_type,
            "data_provider": layer.data_provider.name,
            "created_at": layer.created_at,
            "updated_at": layer.updated_at,
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
    """
    layer = get_object_or_404(InputLayer, uuid=uuid, created_by=request.user)

    if not layer.data_provider or not layer.data_provider.file:
        return JsonResponse(
            {"error": "No file available for this layer"},
            status=400
        )

    response = HttpResponse(
        layer.data_provider.file,
        content_type='application/octet-stream'
    )
    response['Content-Disposition'] = (
        f'attachment; filename="{layer.name}.zip"'
    )

    return response
