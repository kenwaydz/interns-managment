from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, InternProfileViewSet, SupervisorProfileViewSet, TaskViewSet, EvaluationViewSet, UserApprovalViewSet, AttendanceViewSet, TaskCommentViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'interns', InternProfileViewSet, basename='intern')
router.register(r'supervisors', SupervisorProfileViewSet, basename='supervisor')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')
router.register(r'approvals', UserApprovalViewSet, basename='approval')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'task-comments', TaskCommentViewSet, basename='taskcomment')

urlpatterns = [
    path('', include(router.urls)),
]
