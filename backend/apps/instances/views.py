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
        user = self.request.user
        owned_org_ids = set(user.organizations.values_list('id', flat=True))
        member_org_ids = set(user.org_roles.values_list('organization_id', flat=True))
        all_org_ids = owned_org_ids | member_org_ids
        qs = Instance.objects.filter(thing__organization_id__in=all_org_ids)
        thing_id = self.request.query_params.get('thing')
        if thing_id:
            qs = qs.filter(thing_id=thing_id)
        return qs

    def perform_create(self, serializer):
        thing = serializer.validated_data['thing']
        user = self.request.user
        owned_org_ids = set(user.organizations.values_list('id', flat=True))
        member_org_ids = set(user.org_roles.values_list('organization_id', flat=True))

        if thing.organization_id not in (owned_org_ids | member_org_ids):
            raise PermissionDenied("You don't have access to this Thing")

        serializer.save(created_by=self.request.user)
