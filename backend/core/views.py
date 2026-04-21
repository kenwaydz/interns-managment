from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse
from .models import Department, InternProfile, SupervisorProfile, Task, Evaluation, Attendance, TaskComment
from .serializers import DepartmentSerializer, InternProfileSerializer, SupervisorProfileSerializer, TaskSerializer, EvaluationSerializer, AttendanceSerializer, TaskCommentSerializer
from accounts.serializers import UserSerializer
from django.contrib.auth import get_user_model
import openpyxl

User = get_user_model()

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

class UserApprovalViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.filter(is_active=False).exclude(role='ADMIN')

    from rest_framework.decorators import action
    from rest_framework.response import Response

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return self.Response({"error": "Admin only"}, status=403)
        user = self.get_object()
        user.is_active = True
        user.save()
        return self.Response({"status": "user approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return self.Response({"error": "Admin only"}, status=403)
        user = self.get_object()
        user.delete()
        return self.Response({"status": "user rejected"})

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

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admins can export data."}, status=403)
            
        try:
            # Create a workbook and add a worksheet
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Interns"
            
            # Define headers
            headers = ["Intern Name", "Email", "Assigned Department", "Supervisor", "Internship Type", "Start Date", "End Date"]
            ws.append(headers)
            
            # Fetch data
            interns = InternProfile.objects.select_related('user', 'department', 'supervisor', 'supervisor__user').all()
            for intern in interns:
                name = f"{intern.user.first_name} {intern.user.last_name}".strip() or intern.user.username
                email = intern.user.email
                dept = intern.department.name if intern.department else "null"
                
                if intern.supervisor and intern.supervisor.user:
                    supervisor_name = f"{intern.supervisor.user.first_name} {intern.supervisor.user.last_name}".strip() or intern.supervisor.user.username
                else:
                    supervisor_name = "null"
                    
                intern_type = intern.get_internship_type_display() if hasattr(intern, 'get_internship_type_display') else intern.internship_type
                start_date = intern.start_date.strftime("%Y-%m-%d") if intern.start_date else "null"
                end_date = intern.end_date.strftime("%Y-%m-%d") if intern.end_date else "null"
                
                ws.append([name, email, dept, supervisor_name, intern_type, start_date, end_date])
                
            # Prepare response
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename=interns.xlsx'
            wb.save(response)
            
            return response
        except Exception as e:
            print(f"Excel Export Error: {str(e)}")
            return Response({"error": f"Internal Server Error during export: {str(e)}"}, status=500)

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

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Attendance.objects.select_related('intern', 'intern__user').all()
        elif user.role == 'SUPERVISOR':
            return Attendance.objects.select_related('intern', 'intern__user').filter(intern__supervisor__user=user)
        elif user.role == 'INTERN':
            return Attendance.objects.select_related('intern', 'intern__user').filter(intern__user=user)
        return Attendance.objects.none()

    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        if request.user.role != 'INTERN':
            return Response({"error": "Only interns can clock in"}, status=403)
        try:
            intern = InternProfile.objects.get(user=request.user)
            import datetime
            today = datetime.date.today()
            attendance, created = Attendance.objects.get_or_create(intern=intern, date=today)
            if attendance.clock_in_time:
                return Response({"error": "Already clocked in today"}, status=400)
            
            attendance.clock_in_time = datetime.datetime.now().time()
            attendance.save()
            return Response(self.get_serializer(attendance).data)
        except InternProfile.DoesNotExist:
            return Response({"error": "Intern profile not found"}, status=404)

    @action(detail=False, methods=['post'])
    def clock_out(self, request):
        if request.user.role != 'INTERN':
            return Response({"error": "Only interns can clock out"}, status=403)
        try:
            intern = InternProfile.objects.get(user=request.user)
            import datetime
            today = datetime.date.today()
            attendance = Attendance.objects.get(intern=intern, date=today)
            if attendance.clock_out_time:
                return Response({"error": "Already clocked out today"}, status=400)
            
            attendance.clock_out_time = datetime.datetime.now().time()
            attendance.save()
            return Response(self.get_serializer(attendance).data)
        except Attendance.DoesNotExist:
            return Response({"error": "No clock in record found for today"}, status=404)
        except InternProfile.DoesNotExist:
            return Response({"error": "Intern profile not found"}, status=404)

class TaskCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = TaskComment.objects.select_related('author', 'task').all()
        # Filter comments for tasks related to user
        if user.role == 'INTERN':
            queryset = queryset.filter(task__intern__user=user)
        elif user.role == 'SUPERVISOR':
            queryset = queryset.filter(task__supervisor__user=user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
