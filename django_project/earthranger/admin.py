from django.contrib import admin
from .models import (
    APISchedule,
    EarthRangerEvents,
    EarthRangerSetting
)
from django.forms import ModelForm


class APIScheduleForm(ModelForm):
    class Meta:
        model = APISchedule
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        run_every = cleaned_data.get("run_every_minutes")
        custom_interval = cleaned_data.get("custom_interval")

        if run_every and custom_interval:
            raise ValueError(
                "You can either select a predefined "
                "schedule or enter a custom interval, not both."
            )

        if not run_every and not custom_interval:
            raise ValueError(
                "You must either select a predefined "
                "schedule or enter a custom interval."
            )

        return cleaned_data


@admin.register(APISchedule)
class APIScheduleAdmin(admin.ModelAdmin):
    form = APIScheduleForm
    list_display = (
        'name',
        'get_effective_interval',
        'last_run_at',
        'is_active'
    )
    list_filter = ('run_every_minutes',)

    def get_effective_interval(self, obj):
        return obj.get_effective_interval()

    get_effective_interval.short_description = "Effective Interval (min)"


@admin.register(EarthRangerEvents)
class EarthRangerEventsAdmin(admin.ModelAdmin):
    list_display = ("id", "earth_ranger_uuid", "created_at")
    search_fields = ("earth_ranger_uuid", "id")


@admin.register(EarthRangerSetting)
class EarthRangerSettingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "url", "privacy", "is_active")
    search_fields = ("name", "user")
