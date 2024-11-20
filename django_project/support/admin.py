# admin.py

from django.contrib import admin
from .models import Ticket, IssueType


class TicketAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'status',
        'user',
        'assigned_to',
        'created_at',
        'updated_at',
        'resolution_summary'
    )
    list_filter = ('status', 'assigned_to', 'created_at')
    search_fields = ('title', 'description', 'user__email')
    actions = [
        'mark_as_in_progress',
        'mark_as_resolved',
        'mark_as_pending'
    ]

    def mark_as_in_progress(self, request, queryset):
        queryset.update(status='in_progress')
        for ticket in queryset:
            ticket.send_status_update_email()

    def mark_as_resolved(self, request, queryset):
        queryset.update(status='resolved')
        for ticket in queryset:
            ticket.send_status_update_email()

    def mark_as_pending(self, request, queryset):
        queryset.update(status='pending')
        for ticket in queryset:
            ticket.send_status_update_email()


admin.site.register(Ticket, TicketAdmin)
admin.site.register(IssueType)
