import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Department, InternProfile, SupervisorProfile, Task, Evaluation

User = get_user_model()

def run_seed():
    print("Clearing database...")
    User.objects.all().delete()
    Department.objects.all().delete()

    print("Creating Departments...")
    d1 = Department.objects.create(name="IT Department", description="Information Technology")
    d2 = Department.objects.create(name="HR Department", description="Human Resources")

    print("Creating Admin User...")
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@iams.local',
        password='admin',
        first_name='Admin',
        last_name='System',
        role=User.Role.ADMIN
    )

    print("Creating Supervisors...")
    sup_user1 = User.objects.create_user(username='supervisor1', password='password123', first_name='John', last_name='Doe', email='sup1@iams.local', role=User.Role.SUPERVISOR)
    sup_user2 = User.objects.create_user(username='supervisor2', password='password123', first_name='Jane', last_name='Smith', email='sup2@iams.local', role=User.Role.SUPERVISOR)
    
    sup1, _ = SupervisorProfile.objects.get_or_create(user=sup_user1, defaults={'department': d1})
    sup1.department = d1
    sup1.save()
    
    sup2, _ = SupervisorProfile.objects.get_or_create(user=sup_user2, defaults={'department': d2})
    sup2.department = d2
    sup2.save()

    print("Creating Interns...")
    int_user1 = User.objects.create_user(username='intern1', password='password123', first_name='Alice', last_name='Johnson', email='int1@iams.local', role=User.Role.INTERN)
    int_user2 = User.objects.create_user(username='intern2', password='password123', first_name='Bob', last_name='Williams', email='int2@iams.local', role=User.Role.INTERN)
    
    int1, _ = InternProfile.objects.get_or_create(user=int_user1)
    int1.department = d1
    int1.supervisor = sup1
    int1.start_date = date.today()
    int1.end_date = date.today() + timedelta(days=90)
    int1.save()
    
    int2, _ = InternProfile.objects.get_or_create(user=int_user2)
    int2.department = d2
    int2.supervisor = sup2
    int2.start_date = date.today()
    int2.end_date = date.today() + timedelta(days=90)
    int2.save()

    print("Creating Tasks...")
    Task.objects.create(title="Setup environment", description="Install all tools.", status=Task.Status.COMPLETED, supervisor=sup1, intern=int1)
    Task.objects.create(title="Read documentation", description="Understand the core logic.", status=Task.Status.IN_PROGRESS, supervisor=sup1, intern=int1)
    Task.objects.create(title="Develop API", description="Build endpoints.", status=Task.Status.PENDING, supervisor=sup2, intern=int2)

    print("Creating Evaluations...")
    Evaluation.objects.create(score=8, feedback="Good start, needs more focus.", intern=int1, supervisor=sup1)

    print("Seeding complete!")
    print("\n--- Test Users ---")
    print("Admin: username: 'admin', password: 'admin'")
    print("Supervisor: username: 'supervisor1' or 'supervisor2', password: 'password123'")
    print("Intern: username: 'intern1' or 'intern2', password: 'password123'")

if __name__ == '__main__':
    run_seed()
