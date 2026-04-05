from rest_framework import serializers
from .models import Instance

class InstanceSerializer(serializers.ModelSerializer):
    thing_name = serializers.CharField(source='thing.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Instance
        fields = ['id', 'thing', 'thing_name', 'data', 'created_by', 'created_by_username', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']
