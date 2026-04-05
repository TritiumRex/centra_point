from rest_framework import serializers
from .models import Thing, ThingField

class ThingFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThingField
        fields = ['id', 'name', 'field_type', 'required', 'options', 'order']

class ThingSerializer(serializers.ModelSerializer):
    fields = ThingFieldSerializer(many=True, read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Thing
        fields = ['id', 'name', 'slug', 'description', 'schema', 'fields', 'organization', 'organization_name', 'is_active', 'created_at']
        read_only_fields = ['organization', 'created_at']
