from rest_framework import serializers
from .models import Department, InternProfile, SupervisorProfile, Task, Evaluation
from accounts.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class SupervisorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = SupervisorProfile
        fields = '__all__'
        extra_kwargs = {
            'department': {'write_only': True}
        }

class InternProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    supervisor_details = SupervisorProfileSerializer(source='supervisor', read_only=True)

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), write_only=True, required=False, allow_null=True
    )
    supervisor = serializers.PrimaryKeyRelatedField(
        queryset=SupervisorProfile.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = InternProfile
        fields = ['id', 'start_date', 'end_date', 'major', 'user', 'department_details', 'supervisor_details', 'department', 'supervisor']

class TaskSerializer(serializers.ModelSerializer):
    intern_details = InternProfileSerializer(source='intern', read_only=True)
    supervisor_details = SupervisorProfileSerializer(source='supervisor', read_only=True)
    
    intern = serializers.PrimaryKeyRelatedField(
        queryset=InternProfile.objects.all(), write_only=True
    )
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'report', 'created_at', 'updated_at', 'intern_details', 'supervisor_details', 'intern']
        read_only_fields = ('supervisor',)

class EvaluationSerializer(serializers.ModelSerializer):
    intern_details = InternProfileSerializer(source='intern', read_only=True)
    supervisor_details = SupervisorProfileSerializer(source='supervisor', read_only=True)

    intern = serializers.PrimaryKeyRelatedField(
        queryset=InternProfile.objects.all(), write_only=True
    )

    class Meta:
        model = Evaluation
        fields = ['id', 'score', 'feedback', 'created_at', 'intern_details', 'supervisor_details', 'intern']
        read_only_fields = ('supervisor',)
