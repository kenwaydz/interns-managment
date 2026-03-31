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
    start_date = serializers.DateField(write_only=True, required=False, allow_null=True)
    end_date = serializers.DateField(write_only=True, required=False, allow_null=True)
    internship_type = serializers.ChoiceField(choices=InternProfile.InternshipType.choices, write_only=True, required=False)
    major = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'start_date', 'end_date', 'major', 'internship_type', 'department')

    def create(self, validated_data):
        from dateutil.relativedelta import relativedelta
        from core.models import Department
        start_date = validated_data.pop('start_date', None)
        end_date = validated_data.pop('end_date', None)
        internship_type = validated_data.pop('internship_type', InternProfile.InternshipType.BTS)
        major = validated_data.pop('major', '')
        department_id = validated_data.pop('department', None)
        role = validated_data.get('role', User.Role.INTERN)

        if start_date and role == User.Role.INTERN:
            if internship_type == InternProfile.InternshipType.BTS:
                end_date = start_date + relativedelta(months=30)
            elif internship_type == InternProfile.InternshipType.BT:
                end_date = start_date + relativedelta(months=24)
            elif internship_type == InternProfile.InternshipType.CAP:
                end_date = start_date + relativedelta(months=18)
            elif internship_type == InternProfile.InternshipType.CMP:
                end_date = start_date + relativedelta(months=12)
            elif internship_type == InternProfile.InternshipType.UNIVERSITY:
                if not end_date:
                    raise serializers.ValidationError({"end_date": "This field is required for university interns."})
                if end_date > start_date + relativedelta(months=2):
                    raise serializers.ValidationError({"end_date": "University internships cannot exceed 2 months."})

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            is_active=False # All new registrations are inactive until approved
        )
        
        # Automatically create profiles if not admin
        if user.role == User.Role.INTERN:
            InternProfile.objects.create(
                user=user, 
                start_date=start_date, 
                end_date=end_date, 
                major=major,
                internship_type=internship_type
            )
        elif user.role == User.Role.SUPERVISOR:
            department = None
            if department_id:
                try:
                    department = Department.objects.get(id=department_id)
                except Department.DoesNotExist:
                    pass
            SupervisorProfile.objects.create(user=user, department=department)
            
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token
