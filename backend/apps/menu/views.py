from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import MenuNode
from .serializers import MenuNodeSerializer, MenuNodeFlatSerializer


class MenuNodeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list' and self.request.query_params.get('format') != 'flat':
            return MenuNodeSerializer
        return MenuNodeFlatSerializer

    def get_queryset(self):
        user = self.request.user
        org_ids = set(user.org_roles.values_list('organization_id', flat=True))
        qs = MenuNode.objects.filter(organization_id__in=org_ids)
        if self.action == 'list' and self.request.query_params.get('format') != 'flat':
            qs = qs.filter(parent__isnull=True, is_active=True)
        return qs.order_by('sort_order', 'label')

    def perform_create(self, serializer):
        user = self.request.user
        org = user.org_roles.first().organization if hasattr(user, 'org_roles') and user.org_roles.exists() else None
        serializer.save(organization=org)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def menu_tree(request):
    """Return the full menu tree for the current user's organization."""
    user = request.user
    org_ids = set(user.org_roles.values_list('organization_id', flat=True))
    roots = MenuNode.objects.filter(
        organization_id__in=org_ids, parent__isnull=True, is_active=True
    ).order_by('sort_order', 'label')
    serializer = MenuNodeSerializer(roots, many=True)
    return Response(serializer.data)
