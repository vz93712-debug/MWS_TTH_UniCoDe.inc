from apps.wiki.models import UserSyncState, WikiPage

# ФИКС 2: Прописали правильный абсолютный путь и убрали неиспользуемые импорты
from apps.wiki.serializers.serializers_sync import (
    PresenceSerializer,
    SyncStateSerializer,
)
from apps.wiki.utils.sync import PRESENCE_KEY
from django.core.cache import cache  # ФИКС 1: Добавили импорт cache
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView


class SyncStateView(APIView):
    """Эндпоинт для инициализации редактора и проверки версий."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        sync_state, _ = UserSyncState.objects.get_or_create(
            user=request.user, page=page
        )

        active_users_dict = cache.get(PRESENCE_KEY.format(page_id=page_id), {})
        active_users = list(active_users_dict.values())

        data = {
            "server_yjs_version": page.current_version,
            "last_saved_at": page.updated_at,
            "is_offline_pending": sync_state.is_offline,
            "active_users": active_users,
        }

        serializer = SyncStateSerializer(data, context={"request": request})
        return Response(serializer.data)


class PresenceView(APIView):
    """Список тех, кто прямо сейчас редактирует документ."""

    def get(self, request, page_id):
        active_users_dict = cache.get(PRESENCE_KEY.format(page_id=page_id), {})
        serializer = PresenceSerializer(
            active_users_dict.values(), many=True, context={"request": request}
        )
        return Response(serializer.data)
