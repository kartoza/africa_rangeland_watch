# views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from allauth.account.models import EmailAddress


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response(
            {"detail": "Profile not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = UserProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)



@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        return Response(
            {"detail": "Profile not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    current_email = request.user.email
    new_email = request.data.get('email')

    if new_email and new_email != current_email:
        # Handle email update with Allauth
        try:
            # Delete the old email entry
            EmailAddress.objects.filter(
                user=request.user, email=current_email).delete()

            # Add the new email entry
            EmailAddress.objects.create(
                user=request.user,
                email=new_email,
                verified=True,
                primary=True
            )
        except Exception as e:
            return Response(
                {"detail": f"Error updating email: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    serializer = UserProfileSerializer(
        profile,
        data=request.data,
        partial=True,
        context={'request': request}
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ProfileImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, *args, **kwargs):
        # Ensure the profile image is provided
        if 'profile_image' not in request.data:
            return Response(
                {"detail": "Profile image not provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the file type
        profile_image = request.data.get('profile_image')
        if profile_image:
            file_extension = profile_image.name.split('.')[-1].lower()
            allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'svg']
            if file_extension not in allowed_extensions:
                return Response(
                    {
                        "detail": "Invalid file type. "
                        "Only image files are allowed."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            # Get the user profile
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "User profile not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update the profile image
        user_profile.profile_image = profile_image
        user_profile.save()

        # Serialize the user profile and return updated data
        serializer = UserProfileSerializer(
            user_profile,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
