from django.core.cache import cache
from datetime import datetime
import json


PRESENCE_KEY = "presence:page:{page_id}"
PRESENCE_TTL = 30  # секунд


def update_user_presence(page_id: str, user, is_online: bool = True):
    """
    Обновляет присутствие пользователя в комнате страницы.
    Вызывается при connect/disconnect WebSocket.
    """
    redis_key = f"presence:page:{page_id}"
    
    if is_online:
        # Добавляем/обновляем пользователя
        user_data = {
            'user_id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'last_seen': datetime.now().isoformat(),
            'avatar': getattr(user, 'avatar_url', None)
        }
        
        # Получаем текущий хэш
        active = cache.get(redis_key, {})
        if isinstance(active, bytes):
            active = json.loads(active.decode())
        
        active[str(user.id)] = json.dumps(user_data, ensure_ascii=False)
        
        # Сохраняем с TTL (чтобы "мёртвые" сессии очищались)
        cache.set(redis_key, active, timeout=PRESENCE_TTL)
    else:
        # Удаляем пользователя при отключении
        active = cache.get(redis_key, {})
        if isinstance(active, bytes):
            active = json.loads(active.decode())
        
        active.pop(str(user.id), None)
        
        if active:
            cache.set(redis_key, active, timeout=PRESENCE_TTL)
        else:
            cache.delete(redis_key)