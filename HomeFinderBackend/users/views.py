# users/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from .models import CustomUser
from .serializers import UserSerializer, UserRegistrationSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import OutstandingToken



class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_anonymous:
            raise AuthenticationFailed("User is not authenticated.")
        serializer = UserSerializer(user)
        print(serializer.data)
        return Response(serializer.data)

class TokenObtainPairWithUserDetailsView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        tokens = serializer.validated_data
        user = serializer.user  # The authenticated user from the serializer

        user_details = {
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_verified': user.is_verified,
            'firstname':user.first_name,
            'lastname':user.last_name,
            'phone_number':user.phone_number,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
        }

        # Add the tokens and user details to the response
        response_data = {
            'refresh': tokens['refresh'],
            'access': tokens['access'],
            'user': user_details,
        }
        return Response(response_data, status=status.HTTP_200_OK)


from rest_framework_simplejwt.tokens import RefreshToken, AccessToken, TokenError
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

            # Get token objects
            refresh = RefreshToken(refresh_token)
            access = AccessToken(request.auth)

            # Create outstanding token records
            OutstandingToken.objects.create(
                token=str(access),
                user=request.user,
                jti=access['jti'],
                expires_at=access['exp']
            )

            # Blacklist both tokens
            BlacklistedToken.objects.create(token=OutstandingToken.objects.get(jti=access['jti']))
            BlacklistedToken.objects.create(token=OutstandingToken.objects.get(jti=refresh['jti']))

            return Response({'message': 'Successfully logged out.'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Test script
def test_token_invalidation():
    # Get tokens
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    # Call logout
    response = logout_view(request)

    # Verify tokens
    try:
        AccessToken(str(access))
        print("Access token still valid")
    except TokenError:
        print("Access token invalid")