from django.db import models
from apps.organizations.models import Organization

class EmailAccount(models.Model):
    """Email accounts managed via mailcow"""
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='email_accounts')
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # Store hashed or encrypted
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.email
