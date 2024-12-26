 # users/serializers.py
from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name',
            'last_name', 'phone_number', 'role',
            'profile_picture', 'bio', 'is_verified'
        ]
        read_only_fields = ['is_verified']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password',
            'phone_number', 'first_name',
            'last_name', 'role','bio'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, data):
        return data

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone_number', 'role', 'profile_picture', 'bio', 'is_verified']


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # You can add any additional fields here if needed
        data['user'] = {
            'username': self.user.username,
            'email': self.user.email,
            'firstname': self.user.first_name,
            'lastname': self.user.last_name,
            'phonenumber': self.user.phone_number,
            'bio': self.user.bio,
            'role': self.user.role,
            'is_verified': self.user.is_verified,
            'profile_picture': self.user.profile_picture.url if self.user.profile_picture else None,
        }

        return data
