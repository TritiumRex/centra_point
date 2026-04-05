from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserOrganizationRole, UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserOrganizationRoleSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = UserOrganizationRole
        fields = ['id', 'user', 'user_email', 'organization', 'organization_name', 'role', 'created_at']
        read_only_fields = ['created_at']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ['user', 'organization', 'avatar', 'bio']
