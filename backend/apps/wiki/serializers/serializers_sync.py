from rest_framework import serializers
from apps.wiki.models import UserSyncState, WikiPage
from apps.users.models import User

class SyncStateSerializer(serializers.Serializer):
    """
    Возвращает состояние синхронизации страницы.
    """
    server_yjs_version = serializers.IntegerField(read_only=True, help_text="Последняя версия на сервере")
    active_users = serializers.SerializerMethodField(read_only=True, help_text="Список активных редакторов")
    last_saved_at = serializers.DateTimeField(read_only=True, help_text="Время последнего сохранения в БД")
    is_offline_pending = serializers.BooleanField(read_only=True, help_text="Есть ли оффлайн-изменения у текущего пользователя")

    def get_active_users(self, obj):
        """
        Возвращает список активных пользователей из кэша/контекста.
        Формат: [{'user_id': '...', 'name': '...', 'avatar': '...'}, ...]
        """
        # active_users передаётся из View через context (берётся из Redis)
        return self.context.get('active_users', [])


class SyncStateUpdateSerializer(serializers.Serializer):
    """
    Принимает клиентскую версию для синхронизации.
    """
    client_yjs_version = serializers.IntegerField(min_value=0, help_text="Версия Yjs на клиенте")
    is_offline = serializers.BooleanField(default=False, help_text="Было ли потеряно соединение")

    def validate_client_yjs_version(self, value):
        if value < 0:
            raise serializers.ValidationError("Версия не может быть отрицательной")
        return value


class PresenceSerializer(serializers.Serializer):
    """
    Список активных редакторов для UI.
    """
    user_id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    display_name = serializers.SerializerMethodField(read_only=True)
    last_seen = serializers.DateTimeField(read_only=True)
    is_current_user = serializers.BooleanField(read_only=True)

    def get_display_name(self, obj):
        if isinstance(obj, dict):
            return f"{obj.get('first_name', '')} {obj.get('last_name', '')}".strip() or obj.get('email', '')
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email