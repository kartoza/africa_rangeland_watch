from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """
    Admin interface for managing user feedback.
    """
    list_display = [
        'id',
        'name',
        'email',
        'message_preview',
        'created_at',
        'read',
        'user'
    ]
    list_filter = ['read', 'created_at']
    search_fields = ['name', 'email', 'message', 'user__username']
    readonly_fields = ['user', 'name', 'email', 'created_at']
    ordering = ['-created_at']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'name', 'email')
        }),
        ('Feedback', {
            'fields': ('message', 'created_at')
        }),
        ('Admin Actions', {
            'fields': ('read',)
        }),
    )

    def message_preview(self, obj):
        """
        Display truncated message in list view.
        """
        max_length = 80
        if len(obj.message) > max_length:
            return f"{obj.message[:max_length]}..."
        return obj.message
    message_preview.short_description = 'Message'

    actions = ['mark_as_read', 'mark_as_unread']

    def mark_as_read(self, request, queryset):
        """
        Bulk action to mark feedback as read.
        """
        updated = queryset.update(read=True)
        self.message_user(
            request,
            f"{updated} feedback submission(s) marked as read."
        )
    mark_as_read.short_description = "Mark selected feedback as read"

    def mark_as_unread(self, request, queryset):
        """
        Bulk action to mark feedback as unread.
        """
        updated = queryset.update(read=False)
        self.message_user(
            request,
            f"{updated} feedback submission(s) marked as unread."
        )
    mark_as_unread.short_description = "Mark selected feedback as unread"
