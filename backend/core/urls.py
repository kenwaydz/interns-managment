from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, InternProfileViewSet, SupervisorProfileViewSet, TaskViewSet, EvaluationViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'interns', InternProfileViewSet, basename='intern')
router.register(r'supervisors', SupervisorProfileViewSet, basename='supervisor')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
]
