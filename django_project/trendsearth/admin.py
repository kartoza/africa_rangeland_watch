# coding=utf-8
"""
Trends.Earth admin configuration for ARW.
"""
from django.contrib import admin
from .models import TrendsEarthSetting, TrendsEarthJob


@admin.register(TrendsEarthSetting)
class TrendsEarthSettingAdmin(admin.ModelAdmin):
    list_display = ['user', 'email', 'created_at', 'updated_at']
    search_fields = ['user__username', 'email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TrendsEarthJob)
class TrendsEarthJobAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'job_type', 'status', 'created_at', 'completed_at'
    ]
    list_filter = ['job_type', 'status']
    search_fields = ['user__username', 'execution_id']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
