from rest_framework import serializers
from .models import EmailAccount

class EmailAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailAccount
        fields = ['id', 'email', 'password', 'is_active', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True},
        }
