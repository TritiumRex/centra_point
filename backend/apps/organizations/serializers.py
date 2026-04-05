from rest_framework import serializers
from .models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    owner_email = serializers.CharField(source='owner.email', read_only=True)

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'owner', 'owner_email', 'is_active', 'created_at']
        read_only_fields = ['owner', 'created_at']
