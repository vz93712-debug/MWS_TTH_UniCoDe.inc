from rest_framework import serializers
from apps.wiki.models import WikiPageVersion

class VersionListSerializer(serializers.ModelSerializer):
    """
    Легковесный сериализатор для списка версий.
    """
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WikiPageVersion
        fields = ('id', 'version_number', 'comment', 'created_by_name', 'created_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None


class VersionDetailSerializer(serializers.ModelSerializer):
    """
    Полная версия с контентом (для retrieve или отката).
    """
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WikiPageVersion
        fields = ('id', 'version_number', 'content', 'comment', 'created_by_name', 'created_at')

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None