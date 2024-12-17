from rest_framework import serializers
from .models import UserProfile
# from django.conf import settings


class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        source='user.first_name',
        required=False
    )
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    organisations = serializers.StringRelatedField(many=True)
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'first_name',
            'last_name',
            'email',
            'country',
            'user_role',
            'is_support_staff',
            'organisations',
            'profile_image'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        profile_image = validated_data.get('profile_image', None)

        # Update the related user fields
        user = instance.user
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        if 'email' in user_data:
            user.email = user_data['email']
        user.save()

        # Update profile fields
        if profile_image:
            instance.profile_image = profile_image
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def get_profile_image(self, obj):
        if obj.profile_image:
            relative_path = (
                obj.profile_image.url.lstrip('/').replace('media/', 'media/')
            )
            return relative_path
        return None
