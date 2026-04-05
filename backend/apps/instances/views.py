from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied
from .models import Instance
from .serializers import InstanceSerializer

class InstanceViewSet(viewsets.ModelViewSet):
    """Instance (data entry) management"""
    serializer_class = InstanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['data']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # Users see instances only from Things in their organizations
        user = self.request.user
        user_orgs = user.organizations.all() | user.org_roles.values_list('organization', flat=True)
        return Instance.objects.filter(thing__organization__in=user_orgs)

    def perform_create(self, serializer):
        # Verify user has access to the Thing
        thing = serializer.validated_data['thing']
        user_orgs = self.request.user.organizations.all() | self.request.user.org_roles.values_list('organization', flat=True)

        if thing.organization not in user_orgs:
            raise PermissionDenied("You don't have access to this Thing")

        serializer.save(created_by=self.request.user)
