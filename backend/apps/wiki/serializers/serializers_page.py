from rest_framework import serializers
from django.db import transaction

from apps.wiki.utils.backlinks import sync_page_links
from apps.wiki.utils.linked_entities import sync_linked_entities
from apps.wiki.models import WikiPage, WikiPageVersion, PageMembership
from apps.spaces.models import Space, SpaceMembership

class WikiPageDetailSerializer(serializers.ModelSerializer):
    """
    Возвращает полные данные страницы + права текущего пользователя + версию.
    """
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = WikiPage
        fields = (
            'id', 'title', 'description', 'space', 'parent', 'order',
            'content', 'yjs_state', 'current_version',
            'created_by_name', 'updated_by_name', 'permissions',
            'created_at', 'updated_at'
        )

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.email
        return None

    def get_permissions(self, obj):
        """
        Вычисляем права динамически.
        Иерархия: PageMembership > SpaceMembership.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return {'role': 'none', 'can_edit': False, 'can_delete': False}

        user = request.user

        try:
            page_perm = PageMembership.objects.get(page=obj, user=user)
            role = page_perm.role
        except PageMembership.DoesNotExist:
            try:
                space_perm = SpaceMembership.objects.get(space=obj.space, user=user)
                role = space_perm.role
            except SpaceMembership.DoesNotExist:
                role = 'none'

        can_edit = role in ['owner', 'admin']
        can_delete = role in ['owner', ]

        return {
            'role': role,
            'can_edit': can_edit,
            'can_delete': can_delete
        }


class WikiPageUpdateSerializer(serializers.ModelSerializer):
    """
    Сериализатор для PATCH (обновления/сохранения).
    """
    create_version = serializers.BooleanField(write_only=True, default=False, required=False)
    version_comment = serializers.CharField(write_only=True, default="", required=False)

    class Meta:
        model = WikiPage
        fields = ('title', 'description', 'content', 'yjs_state', 'create_version', 'version_comment')

    def update(self, instance, validated_data):
        create_version = validated_data.pop('create_version', False)
        version_comment = validated_data.pop('version_comment', "")
    
        try:
            with transaction.atomic():
                
                # Стандартное обновление полей
                for attr, value in validated_data.items():
                    setattr(instance, attr, value)
                instance.updated_by = self.context['request'].user
                instance.save()

                # Версионирование
                if create_version:
                    instance.current_version += 1
                    instance.save(update_fields=['current_version'])

                    WikiPageVersion.objects.create(
                        page=instance,
                        version_number=instance.current_version,  # Уже новый номер
                        content=instance.content,                  # Снапшот контента
                        comment=version_comment,                   # Комментарий из запроса
                        created_by=instance.updated_by             # Кто создал
                    )

                sync_page_links(instance)
                sync_linked_entities(instance)
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise

        return instance
    

class WikiPageMoveSerializer(serializers.Serializer):
    """
    Сериализатор для перемещения страницы в другое пространство или под другую страницу.
    """
    new_space_id = serializers.UUIDField(required=False, allow_null=True)
    new_parent_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, data):
        # Валидация: должен быть указан хотя бы один параметр для перемещения
        if not data.get('new_space_id') and not data.get('new_parent_id'):
            raise serializers.ValidationError("Необходимо указать new_space_id или new_parent_id.")
        
        return data