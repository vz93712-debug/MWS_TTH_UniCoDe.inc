from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta

from apps.wiki.models import WikiPage, UserSyncState
from apps.wiki.serializers.serializers_sync import (
    SyncStateSerializer,
    SyncStateUpdateSerializer,
    PresenceSerializer,
)
from apps.wiki.permissions import IsSpaceOrPageMember


# Ключи для Redis
PRESENCE_KEY = "presence:page:{page_id}"
PRESENCE_TTL = 30  # секунд


class SyncStateView(APIView):
    """
    GET  /pages/{page_id}/sync-state/  — получение состояния
    POST /pages/{page_id}/sync-state/  — фиксация клиентской версии
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        
        # 1. Получаем server_yjs_version из current_version страницы
        server_yjs_version = page.current_version
        
        # 2. Получаем active_users из Redis
        active_users = self._get_active_users(page_id)
        
        # 3. last_saved_at — из модели
        last_saved_at = page.updated_at
        
        # 4. Проверяем, есть ли оффлайн-изменения у текущего пользователя
        sync_state, _ = UserSyncState.objects.get_or_create(
            user=request.user,
            page=page,
            defaults={'client_yjs_version': 0}
        )
        is_offline_pending = sync_state.is_offline
        
        serializer = SyncStateSerializer(
            instance=None,  # Это не модель, а агрегированные данные
            context={
                'active_users': active_users,
                'request': request
            }
        )
        
        # Формируем ответ вручную, так как это не модель
        return Response({
            'server_yjs_version': server_yjs_version,
            'active_users': active_users,
            'last_saved_at': last_saved_at,
            'is_offline_pending': is_offline_pending
        })

    def post(self, request, page_id):
        """Фиксация клиентской версии для разрешения конфликтов и оффлайн-мерджа."""
        page = get_object_or_404(WikiPage, id=page_id)
        
        serializer = SyncStateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        
        # Обновляем или создаём запись синхронизации
        sync_state, created = UserSyncState.objects.update_or_create(
            user=request.user,
            page=page,
            defaults={
                'client_yjs_version': validated_data['client_yjs_version'],
                'is_offline': validated_data.get('is_offline', False),
                'last_activity': timezone.now()
            }
        )
        
        # Если клиент был оффлайн — можно запустить логику мерджа (опционально)
        if validated_data.get('is_offline'):
            # Здесь можно вызвать задачу Celery для слияния изменений
            # merge_offline_changes.delay(page_id, request.user.id)
            pass
        
        return Response({
            'detail': 'Состояние синхронизации обновлено',
            'server_yjs_version': page.current_version,
            'client_yjs_version': sync_state.client_yjs_version
        })

    def _get_active_users(self, page_id: str) -> list:
        """
        Получает список активных пользователей из Redis.
        Формат ключа: presence:page:{page_id}
        Значение: hash {user_id: {json_with_user_data}}
        """
        redis_key = PRESENCE_KEY.format(page_id=page_id)
        active = cache.get(redis_key, {})
        
        # Преобразуем в список словарей
        users = []
        for user_id, data in active.items():
            if isinstance(data, str):
                import json
                try:
                    data = json.loads(data)
                except:
                    continue
            users.append(data)
        
        return users


class PresenceView(APIView):
    """
    GET /pages/{page_id}/presence/
    Возвращает список активных редакторов для отображения в UI.
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        
        # Получаем сырые данные из Redis
        redis_key = PRESENCE_KEY.format(page_id=page_id)
        active_raw = cache.get(redis_key, {})
        
        # Формируем ответ
        presence_list = []
        for user_id, data in active_raw.items():
            if isinstance(data, str):
                import json
                try:
                    data = json.loads(data)
                except:
                    continue
            
            presence_list.append({
                'user_id': user_id,
                'email': data.get('email', ''),
                'display_name': f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or data.get('email', ''),
                'last_seen': data.get('last_seen'),
                'is_current_user': user_id == str(request.user.id)
            })
        
        # Сортируем: текущий пользователь в конце, остальные по last_seen
        presence_list.sort(key=lambda x: (x['is_current_user'], x['last_seen'] or ''), reverse=True)
        
        return Response(presence_list)