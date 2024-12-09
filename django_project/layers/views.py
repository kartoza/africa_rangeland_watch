from collections import defaultdict
from django.shortcuts import render  # noqa: F401
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
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
