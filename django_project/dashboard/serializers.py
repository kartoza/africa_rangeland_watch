from base.models import Organisation
from rest_framework import serializers
from .models import Dashboard
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User, Group


class DashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dashboard
        fields = '__all__'

    def to_internal_value(self, data):
        # Override the `to_internal_value`
        # to customize how we handle incoming data.
        internal_value = super().to_internal_value(data)

        # Handle organisations
        organisations = internal_value.get('organisations', [])
        if organisations:
            try:
                internal_value['organisations'] = [
                    Organisation.objects.get(pk=int(org))
                    if isinstance(org, str) else org
                    for org in organisations
                ]
            except (ValueError, ObjectDoesNotExist):
                raise serializers.ValidationError(
                    {"organisations": _("Invalid organisation ID.")}
                )

        # Handle groups
        groups = internal_value.get('groups', [])
        if groups:
            try:
                internal_value['groups'] = [
                    Group.objects.get(pk=int(group))
                    if isinstance(group, str) else group
                    for group in groups
                ]
            except (ValueError, ObjectDoesNotExist):
                raise serializers.ValidationError(
                    {"groups": _("Invalid group ID.")}
                )

        # Handle users
        users = internal_value.get('users', [])
        if users:
            try:
                internal_value['users'] = [
                    User.objects.get(pk=int(user))
                    if isinstance(user, str) else user
                    for user in users
                ]
            except (ValueError, ObjectDoesNotExist):
                raise serializers.ValidationError(
                    {"users": _("Invalid user ID.")}
                )

        return internal_value
