from rest_framework import serializers
from apps.wiki.models import Comment

class CommentSerializer(serializers.ModelSerializer):
    """
    Сериализатор для комментариев с поддержкой вложенных ответов (tree).
    """
    user_name = serializers.SerializerMethodField()
    # Принимаем parent_id как обычный UUID (без dotted source)
    parent_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)
    # Для вывода: вложенные ответы (только при детализации)
    children = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comment
        fields = (
            'id', 'user_id', 'user_name', 'mark_id', 'content', 
            'parent_id', 'children', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user_id', 'created_at', 'updated_at', 'children')

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_children(self, obj):
        """
        Возвращает вложенные комментарии (только один уровень для производительности).
        Для полной рекурсии см. build_comment_tree() ниже.
        """
        # Если это список — не грузим children, чтобы избежать N+1
        if not hasattr(obj, '_prefetched_objects_cache'):
            return []
        replies = getattr(obj, 'replies', [])
        return CommentSerializer(replies, many=True, context=self.context).data

    def validate_parent_id(self, value):
        """Проверка: родительский комментарий должен принадлежать той же странице."""
        if value:
            page = self.context.get('page')
            if page and not Comment.objects.filter(id=value, page=page).exists():
                raise serializers.ValidationError(
                    "Родительский комментарий не найден или относится к другой странице."
                )
        return value

    def create(self, validated_data):
        # Извлекаем parent_id из validated_data (он записан как обычное поле)
        parent_id = validated_data.pop('parent_id', None)
        
        validated_data['user'] = self.context['request'].user
        validated_data['page'] = self.context['page']
        
        if parent_id:
            validated_data['parent_id'] = parent_id  # Django сам резолвит в ForeignKey
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # parent_id можно менять, но осторожно: нельзя создавать циклы
        parent_id = validated_data.pop('parent_id', None)
        if parent_id is not None:
            if parent_id == instance.id:
                raise serializers.ValidationError("Комментарий не может быть своим собственным родителем.")
            # Проверка на цикл (упрощённая)
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
    Используется отдельно, когда нужно отдать всю иерархию за один запрос.
    """
    user_name = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ('id', 'user_id', 'user_name', 'mark_id', 'content', 'children', 'created_at', 'updated_at')

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def get_children(self, obj):
        # Рекурсивный вывод (ограничим глубину в коде, не в сериализаторе)
        replies = getattr(obj, 'replies', [])
        return CommentTreeSerializer(replies, many=True, context=self.context).data