from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        SUPERVISOR = "SUPERVISOR", "Supervisor"
        INTERN = "INTERN", "Intern"
        
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.INTERN)
    
    def __str__(self):
        return f"{self.username} ({self.role})"
