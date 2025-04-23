from django import forms
from layers.models import ExternalLayer


class ExternalLayerUploadForm(forms.ModelForm):
    file = forms.FileField(required=True)

    class Meta:
        model = ExternalLayer
        fields = [
            "name",
            "layer_type",
            "source",
            "file",
            "is_public",
            "is_auto_published",
        ]
