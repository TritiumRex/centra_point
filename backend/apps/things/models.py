from django.db import models
from django.contrib.postgres.fields import JSONField
from apps.organizations.models import Organization

class Thing(models.Model):
    """
    Flexible schema definition for custom entity types.
    Each Thing is a template that organizations can customize.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='things')
    name = models.CharField(max_length=255)  # e.g., "Projects", "Expenses", "Tasks"
    slug = models.SlugField()
    description = models.TextField(blank=True)

    # Schema definition: flexible field types
    # Example: {
    #   "fields": [
    #     {"name": "title", "type": "text", "required": true},
    #     {"name": "amount", "type": "number", "required": false},
    #     {"name": "date", "type": "date", "required": true},
    #     {"name": "status", "type": "select", "options": ["todo", "in_progress", "done"]}
    #   ]
    # }
    schema = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('organization', 'slug')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.organization.name} - {self.name}"


class ThingField(models.Model):
    """Individual field definition for a Thing schema"""
    FIELD_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('datetime', 'DateTime'),
        ('boolean', 'Boolean'),
        ('select', 'Select'),
        ('multiselect', 'Multi-Select'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('textarea', 'Text Area'),
    ]

    thing = models.ForeignKey(Thing, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES)
    required = models.BooleanField(default=False)
    options = models.JSONField(default=list, blank=True)  # For select fields
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.thing.name} - {self.name}"
