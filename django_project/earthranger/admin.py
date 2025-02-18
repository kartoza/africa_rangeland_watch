from django.contrib import admin
from .models import APISchedule, EarthRangerObservation


@admin.register(APISchedule)
class APIScheduleAdmin(admin.ModelAdmin):
    list_display = ('name', 'run_every_minutes', 'last_run_at')


@admin.register(EarthRangerObservation)
class EarthRangerObservationAdmin(admin.ModelAdmin):
    list_display = ("name", "last_updated")
