import hashlib
import json
import logging
from datetime import datetime

from apps.wiki.models import WikiPage
from django.core.cache import cache

logger = logging.getLogger(__name__)

PRESENCE_KEY = "presence:page:{page_id}"
YJS_STATE_KEY = "yjs_state_{page_id}"
PRESENCE_TTL = 60


def update_user_presence(page_id: str, user, is_online: bool = True):
    """Обновляет список активных пользователей в Redis."""
    redis_key = PRESENCE_KEY.format(page_id=page_id)
    active = cache.get(redis_key, {})

    if is_online:
        user_data = {
            "user_id": str(user.id),
            "email": user.email,
            "display_name": f"{user.first_name} {user.last_name}".strip() or user.email,
            "last_seen": datetime.now().isoformat(),
        }
        active[str(user.id)] = user_data
        cache.set(redis_key, active, timeout=PRESENCE_TTL)
    else:
        active.pop(str(user.id), None)
        if active:
            cache.set(redis_key, active, timeout=PRESENCE_TTL)
        else:
            cache.delete(redis_key)


def persist_yjs_state(page_id: str):
    """
    Берет бинарные данные из Redis и сохраняет их в БД.
    Вызывается, когда последний пользователь уходит со страницы.
    """
    state_key = YJS_STATE_KEY.format(page_id=page_id)
    binary_state = cache.get(state_key)

    if binary_state:
        WikiPage.objects.filter(id=page_id).update(
            yjs_state=binary_state, updated_at=datetime.now()
        )
        logger.info(f"Состояние Yjs для страницы {page_id} успешно сохранено в БД.")
