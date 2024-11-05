from django.contrib import admin
from .models import AlertSetting, IndicatorAlertHistory, Indicator


@admin.register(AlertSetting)
class AlertSettingAdmin(admin.ModelAdmin):
    list_display = ('name', 'enable_alert', 'email_alert', 'in_app_alert', 'last_alert')
    list_filter = ('enable_alert', 'email_alert', 'in_app_alert', 'anomaly_detection_alert')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'enable_alert', 'last_alert')
        }),
        ('Threshold Settings', {
            'fields': ('threshold_comparison', 'threshold_value', 'anomaly_detection_alert')
        }),
        ('Notification Settings', {
            'fields': ('email_alert', 'in_app_alert')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
        ('User', {
            'fields': ('user',)
        }),
    )


@admin.register(IndicatorAlertHistory)
class IndicatorAlertHistoryAdmin(admin.ModelAdmin):
    list_display = ('alert_setting', 'created_at', 'text')
    list_filter = ('created_at',)
    search_fields = ('alert_setting__name', 'text')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'


@admin.register(Indicator)
class IndicatorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
