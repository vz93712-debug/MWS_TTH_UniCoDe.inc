from rest_framework import serializers
from apps.wiki.models import WikiPage

class LinkedPageSerializer(serializers.ModelSerializer):
    """Легковесный сериализатор для связанных страниц"""
    class Meta:
        model = WikiPage
        fields = ['id', 'title', 'updated_at']
        read_only_fields = fields


class GraphResponseSerializer(serializers.Serializer):
    """Специальный сериализатор для формата графа (nodes/links)"""
    nodes = serializers.ListField(child=serializers.DictField())
    links = serializers.ListField(child=serializers.DictField())