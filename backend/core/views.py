from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import Department, InternProfile, SupervisorProfile, Task, Evaluation
from .serializers import DepartmentSerializer, InternProfileSerializer, SupervisorProfileSerializer, TaskSerializer, EvaluationSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class SupervisorProfileViewSet(viewsets.ModelViewSet):
    queryset = SupervisorProfile.objects.select_related('user', 'department').all()
    serializer_class = SupervisorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

class InternProfileViewSet(viewsets.ModelViewSet):
    serializer_class = InternProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return InternProfile.objects.select_related('user', 'department', 'supervisor').all()
        elif user.role == 'SUPERVISOR':
            return InternProfile.objects.select_related('user', 'department', 'supervisor').filter(supervisor__user=user)
        elif user.role == 'INTERN':
            return InternProfile.objects.select_related('user', 'department', 'supervisor').filter(user=user)
        return InternProfile.objects.none()

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            from rest_framework.response import Response
            return Response({"error": "Only admins can delete interns."}, status=403)
        intern = self.get_object()
        user_to_delete = intern.user
        response = super().destroy(request, *args, **kwargs)
        user_to_delete.delete()
        return response

    def perform_update(self, serializer):
        # Update user fields if provided
        profile = serializer.save()
        user_data = self.request.data.get('user', {})
        if user_data:
            user = profile.user
            user.first_name = user_data.get('first_name', user.first_name)
            user.last_name = user_data.get('last_name', user.last_name)
            user.email = user_data.get('email', user.email)
            user.save()

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Task.objects.select_related('intern', 'supervisor', 'intern__user', 'supervisor__user').all()
        elif user.role == 'SUPERVISOR':
            return Task.objects.select_related('intern', 'supervisor', 'intern__user', 'supervisor__user').filter(supervisor__user=user)
        elif user.role == 'INTERN':
            return Task.objects.select_related('intern', 'supervisor', 'intern__user', 'supervisor__user').filter(intern__user=user)
        return Task.objects.none()

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in ['ADMIN', 'SUPERVISOR']:
            from rest_framework.response import Response
            return Response({"error": "Not authorized to delete tasks."}, status=403)
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'SUPERVISOR':
            supervisor = SupervisorProfile.objects.get(user=user)
            serializer.save(supervisor=supervisor)
        elif user.role == 'ADMIN':
            intern = serializer.validated_data.get('intern')
            supervisor = intern.supervisor if (intern and intern.supervisor) else SupervisorProfile.objects.first()
            serializer.save(supervisor=supervisor)

class EvaluationViewSet(viewsets.ModelViewSet):
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Evaluation.objects.select_related('intern', 'supervisor', 'intern__user', 'supervisor__user').all()
        elif user.role == 'SUPERVISOR':
            return Evaluation.objects.select_related('intern', 'supervisor', 'intern__user', 'supervisor__user').filter(supervisor__user=user)
        elif user.role == 'INTERN':
            return Evaluation.objects.select_related('intern', 'supervisor', 'intern__user', 'supervisor__user').filter(intern__user=user)
        return Evaluation.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'SUPERVISOR':
            supervisor = SupervisorProfile.objects.get(user=user)
            serializer.save(supervisor=supervisor)
        elif user.role == 'ADMIN':
            intern = serializer.validated_data.get('intern')
            supervisor = intern.supervisor if (intern and intern.supervisor) else SupervisorProfile.objects.first()
            serializer.save(supervisor=supervisor)
