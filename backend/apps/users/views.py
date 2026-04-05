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
        user = self.request.user
        owned_org_ids = set(user.organizations.values_list('id', flat=True))
        member_org_ids = set(user.org_roles.values_list('organization_id', flat=True))
        return User.objects.filter(
            org_roles__organization_id__in=owned_org_ids | member_org_ids
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
        owned_org_ids = set(user.organizations.values_list('id', flat=True))
        member_org_ids = set(user.org_roles.values_list('organization_id', flat=True))
        return UserOrganizationRole.objects.filter(organization_id__in=owned_org_ids | member_org_ids)
