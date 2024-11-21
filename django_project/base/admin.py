from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Organisation, UserProfile


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "User Profile"
    fk_name = "user"
    fields = (
        'organisation', 'country', 'user_type',
        'user_role', 'is_support_staff',
        'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

    list_display = ('username', 'email', 'first_name', 'last_name',
                    'is_staff', 'get_user_type', 'get_user_role')
    list_select_related = ('profile',)
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def get_user_type(self, instance):
        """Return user type."""
        return instance.profile.user_type

    get_user_type.short_description = 'User Type'

    def get_user_role(self, instance):
        """Return user role."""
        return instance.profile.user_role

    get_user_role.short_description = 'User Role'

    def get_inline_instances(self, request, obj=None):
        """Return inline instances."""
        if not obj:
            return []
        return super(UserAdmin, self).get_inline_instances(request, obj)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)
