from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import InternProfile, SupervisorProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    start_date = serializers.DateField(write_only=True, required=False)
    end_date = serializers.DateField(write_only=True, required=False)
    major = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'start_date', 'end_date', 'major')

    def create(self, validated_data):
        start_date = validated_data.pop('start_date', None)
        end_date = validated_data.pop('end_date', None)
        major = validated_data.pop('major', '')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', User.Role.INTERN)
        )
        
        # Automatically create profiles if not admin
        if user.role == User.Role.INTERN:
            InternProfile.objects.create(user=user, start_date=start_date, end_date=end_date, major=major)
        elif user.role == User.Role.SUPERVISOR:
            SupervisorProfile.objects.create(user=user)
            
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token
