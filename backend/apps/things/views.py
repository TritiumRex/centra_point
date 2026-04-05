from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Thing
from .serializers import ThingSerializer

class ThingViewSet(viewsets.ModelViewSet):
    """Thing (custom entity type) management"""
    serializer_class = ThingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        owned_org_ids = set(user.organizations.values_list('id', flat=True))
        member_org_ids = set(user.org_roles.values_list('organization_id', flat=True))
        return Thing.objects.filter(organization_id__in=owned_org_ids | member_org_ids)

    def perform_create(self, serializer):
        # Get user's current organization or primary org
        org = self.request.user.organizations.first()
        if not org:
            return Response({'error': 'User has no organization'}, status=400)
        serializer.save(organization=org)
