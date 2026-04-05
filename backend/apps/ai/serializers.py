from rest_framework import serializers
from .models import AIAnalysis

class AIAnalysisSerializer(serializers.ModelSerializer):
    instance_id = serializers.IntegerField(source='instance.id', read_only=True)

    class Meta:
        model = AIAnalysis
        fields = ['id', 'instance_id', 'description', 'tags', 'summary', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
