from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserOrganizationRole, UserProfile
from .serializers import UserSerializer, UserOrganizationRoleSerializer, UserProfileSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """User management viewset"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see only users in their organizations
        user = self.request.user
        user_orgs = user.organizations.all() | user.org_roles.values_list('organization', flat=True)
        return User.objects.filter(
            org_roles__organization__in=user_orgs
        ).distinct()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserOrganizationRoleViewSet(viewsets.ModelViewSet):
    """User roles within organizations"""
    serializer_class = UserOrganizationRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_orgs = user.organizations.all() | user.org_roles.values_list('organization', flat=True)
        return UserOrganizationRole.objects.filter(organization__in=user_orgs)
