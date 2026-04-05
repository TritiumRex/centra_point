from django.db import models
from django.contrib.postgres.fields import JSONField
from apps.things.models import Thing
from django.contrib.auth.models import User

class Instance(models.Model):
    """
    An instance of a Thing - actual data entry.
    Stores flexible data based on the Thing's schema.
    """
    thing = models.ForeignKey(Thing, on_delete=models.CASCADE, related_name='instances')

    # Flexible data storage: matches the Thing's schema
    # Example: {"title": "Buy groceries", "amount": 50.00, "date": "2024-04-04", "status": "todo"}
    data = models.JSONField(default=dict)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_instances')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['thing', 'created_at']),
        ]

    def __str__(self):
        return f"{self.thing.name} - {self.data.get('name', 'Unnamed')}"
