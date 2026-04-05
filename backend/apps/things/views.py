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
        # Users see Things only from their organizations
        user = self.request.user
        user_orgs = user.organizations.all() | user.org_roles.values_list('organization', flat=True)
        return Thing.objects.filter(organization__in=user_orgs)

    def perform_create(self, serializer):
        # Get user's current organization or primary org
        org = self.request.user.organizations.first()
        if not org:
            return Response({'error': 'User has no organization'}, status=400)
        serializer.save(organization=org)
