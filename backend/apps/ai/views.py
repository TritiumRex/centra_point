from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.instances.models import Instance
from .models import AIAnalysis
from .serializers import AIAnalysisSerializer
from .hermes_client import hermes

class AIAnalysisViewSet(viewsets.ModelViewSet):
    """AI analysis for instances"""
    serializer_class = AIAnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        owned_org_ids = set(user.organizations.values_list('id', flat=True))
        member_org_ids = set(user.org_roles.values_list('organization_id', flat=True))
        return AIAnalysis.objects.filter(instance__thing__organization_id__in=owned_org_ids | member_org_ids)

    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Analyze an instance with Hermes"""
        instance_id = request.data.get('instance_id')
        try:
            instance = Instance.objects.get(id=instance_id)
        except Instance.DoesNotExist:
            return Response({'error': 'Instance not found'}, status=status.HTTP_404_NOT_FOUND)

        owned_org_ids = set(request.user.organizations.values_list('id', flat=True))
        member_org_ids = set(request.user.org_roles.values_list('organization_id', flat=True))
        if instance.thing.organization_id not in (owned_org_ids | member_org_ids):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        # Generate analysis
        try:
            description = hermes.generate_description(instance.data)
            tags = hermes.generate_tags(instance.data, instance.thing.name)
            summary = hermes.generate_summary(instance.data)

            analysis, created = AIAnalysis.objects.update_or_create(
                instance=instance,
                defaults={
                    'description': description,
                    'tags': tags,
                    'summary': summary,
                }
            )
            serializer = self.get_serializer(analysis)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
