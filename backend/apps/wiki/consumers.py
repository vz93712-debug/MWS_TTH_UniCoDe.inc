import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.core.cache import cache  # type: ignore
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_by_token(token):
    """Асинхронная проверка JWT токена"""
    try:
        if not token:
            return None
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token["user_id"])
        return user
    except Exception:
        return None


# 👇 НОВЫЕ БЕЗОПАСНЫЕ ОВЕРТКИ ДЛЯ REDIS 👇
@database_sync_to_async
def async_cache_get(key, default=None):
    return cache.get(key, default)


@database_sync_to_async
def async_cache_set(key, value, timeout):
    cache.set(key, value, timeout=timeout)


# 👆 ==================================== 👆


class WikiPageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.page_id = self.scope["url_route"]["kwargs"]["page_id"]  # type: ignore
        self.room_group_name = f"page_{self.page_id}"
        self.presence_key = f"presence_{self.page_id}"
        self.state_key = f"yjs_state_{self.page_id}"

        # 1. Парсим токен
        query_string = self.scope["query_string"].decode()  # type: ignore
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]

        self.user = await get_user_by_token(token)

        if not self.user:
            await self.close(code=4001)
            return

        await self.accept()

        # 2. Presence: Добавляем юзера в онлайн
        await self.add_to_presence()

        # 3. Handshake: Отправляем текущее состояние (байты)
        current_state = await async_cache_get(self.state_key)
        if current_state:
            await self.send(bytes_data=current_state)  # type: ignore

        # 4. Входим в группу
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)  # type: ignore

    async def disconnect(self, code):
        if hasattr(self, "user") and self.user is not None:
            await self.remove_from_presence()
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )  # type: ignore

    async def receive(self, text_data=None, bytes_data=None):
        if bytes_data:
            # Обновляем состояние в Redis
            await async_cache_set(self.state_key, bytes_data, timeout=3600)

            await self.channel_layer.group_send(  # type: ignore
                self.room_group_name,
                {
                    "type": "yjs_message",
                    "bytes_data": bytes_data,
                    "sender_channel_name": self.channel_name,
                },
            )

    async def yjs_message(self, event):
        if self.channel_name != event["sender_channel_name"]:
            await self.send(bytes_data=event["bytes_data"])  # type: ignore

    async def add_to_presence(self):
        users = await async_cache_get(self.presence_key, []) or []
        user_data = {
            "id": str(self.user.id),
            "email": self.user.email,
        }
        if user_data not in users:
            users.append(user_data)
            await async_cache_set(self.presence_key, users, timeout=300)

    async def remove_from_presence(self):
        users = await async_cache_get(self.presence_key, []) or []
        users = [u for u in users if u["id"] != str(self.user.id)]
        await async_cache_set(self.presence_key, users, timeout=300)
