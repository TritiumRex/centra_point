from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Organization
from .serializers import OrganizationSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    """Organization management viewset"""
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users see only organizations they own or are members of
        user = self.request.user
        return Organization.objects.filter(
            owner=user
        ) | Organization.objects.filter(
            user_roles__user=user
        )

    def perform_create(self, serializer):
        # Auto-set owner to current user
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """List members of an organization"""
        org = self.get_object()
        from apps.users.models import UserOrganizationRole
        from apps.users.serializers import UserOrganizationRoleSerializer
        roles = UserOrganizationRole.objects.filter(organization=org)
        serializer = UserOrganizationRoleSerializer(roles, many=True)
        return Response(serializer.data)
