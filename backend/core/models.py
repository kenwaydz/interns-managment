from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class SupervisorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='supervisor_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='supervisors')

    def __str__(self):
        return f"Supervisor: {self.user.username}"

class InternProfile(models.Model):
    class InternshipType(models.TextChoices):
        BTS = 'BTS', 'BTS (30 months)'
        BT = 'BT', 'BT (24 months)'
        CAP = 'CAP', 'CAP (18 months)'
        CMP = 'CMP', 'CMP (12 months)'
        UNIVERSITY = 'UNIVERSITY', 'Stagiaire Universitaire (Max 2 months)'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='intern_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='interns')
    supervisor = models.ForeignKey(SupervisorProfile, on_delete=models.SET_NULL, null=True, related_name='interns')
    internship_type = models.CharField(max_length=20, choices=InternshipType.choices, default=InternshipType.BTS)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    major = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return f"Intern: {self.user.username}"

class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'

    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    report = models.TextField(blank=True)
    supervisor = models.ForeignKey(SupervisorProfile, on_delete=models.CASCADE, related_name='assigned_tasks')
    intern = models.ForeignKey(InternProfile, on_delete=models.CASCADE, related_name='tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Evaluation(models.Model):
    intern = models.ForeignKey(InternProfile, on_delete=models.CASCADE, related_name='evaluations')
    supervisor = models.ForeignKey(SupervisorProfile, on_delete=models.CASCADE, related_name='evaluations')
    score = models.IntegerField(help_text="Score from 1 to 10")
    feedback = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation for {self.intern.user.username} by {self.supervisor.user.username}"
