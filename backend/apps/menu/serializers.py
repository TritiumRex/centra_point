from rest_framework import serializers
from .models import MenuNode


class MenuNodeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = MenuNode
        fields = [
            'id', 'parent', 'label', 'icon', 'node_type',
            'url', 'ssh_host', 'panel_type', 'sort_order',
            'is_active', 'children',
        ]

    def get_children(self, obj):
        # Only include children for top-level serialization (tree endpoint)
        if self.context.get('flat'):
            return []
        children = obj.children.filter(is_active=True).order_by('sort_order', 'label')
        return MenuNodeSerializer(children, many=True, context=self.context).data


class MenuNodeFlatSerializer(serializers.ModelSerializer):
    """Flat serializer for CRUD operations (no nested children)."""
    class Meta:
        model = MenuNode
        fields = [
            'id', 'parent', 'label', 'icon', 'node_type',
            'url', 'ssh_host', 'panel_type', 'sort_order',
            'is_active',
        ]
