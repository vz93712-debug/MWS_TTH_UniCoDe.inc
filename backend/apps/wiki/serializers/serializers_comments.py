# apps/wiki/serializers/serializers_comments.py
from rest_framework import serializers
from apps.wiki.models import Comment

class CommentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для комментариев с поддержкой вложенных ответов (tree).
    """
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    # Для ЗАПИСИ (создание/обновление)
    parent_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    
    # Для ЧТЕНИЯ (вывод в ответе)
    parent = serializers.SerializerMethodField(read_only=True)
    
    children = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = (
            'id', 'user_id', 'user_name', 'mark_id', 'content', 
            'parent', 'parent_id', 'children', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user_id', 'created_at', 'updated_at', 'children', 'parent')

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_parent(self, obj):
        return str(obj.parent.id) if obj.parent else None

    def get_children(self, obj):
        return []

    def validate_parent_id(self, value):
        if value:
            page = self.context.get('page')
            if page and not Comment.objects.filter(id=value, page=page).exists():
                raise serializers.ValidationError(
                    "Родительский комментарий не найден или относится к другой странице."
                )
        return value

    def create(self, validated_data):
        parent_id = validated_data.pop('parent_id', None)
        validated_data['user'] = self.context['request'].user
        validated_data['page'] = self.context['page']
        if parent_id:
            validated_data['parent_id'] = parent_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        parent_id = validated_data.pop('parent_id', None)
        if parent_id is not None:
            if parent_id == instance.id:
                raise serializers.ValidationError("Комментарий не может быть своим собственным родителем.")
            current = instance
            while current.parent:
                if current.parent.id == parent_id:
                    raise serializers.ValidationError("Нельзя создать циклическую ссылку в комментариях.")
                current = current.parent
            instance.parent_id = parent_id
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class CommentTreeSerializer(serializers.ModelSerializer):
    """
    Сериализатор для вывода полного дерева комментариев (рекурсивный).
    """
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_name = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    parent = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'user_id', 'user_name', 'mark_id', 'content', 'parent', 'children', 'created_at', 'updated_at')

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_parent(self, obj):
        return str(obj.parent.id) if obj.parent else None

    def get_children(self, obj):
        replies = getattr(obj, 'replies', [])
        return CommentTreeSerializer(replies, many=True, context=self.context).data