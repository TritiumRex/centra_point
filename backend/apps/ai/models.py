from django.db import models
from apps.instances.models import Instance

class AIAnalysis(models.Model):
    """Store AI-generated analysis for instances"""
    instance = models.OneToOneField(Instance, on_delete=models.CASCADE, related_name='ai_analysis')
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analysis for {self.instance}"
