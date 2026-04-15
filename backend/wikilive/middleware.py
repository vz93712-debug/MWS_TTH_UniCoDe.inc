# wikilive/middleware.py
import urllib.parse

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


@database_sync_to_async
def get_user_from_jwt(token_string):
    """Синхронно лезем в БД за юзером (оборачиваем в async)"""
    try:
        # Декодируем JWT токен
        access_token = AccessToken(token_string)
        # Достаем юзера по id из payload токена
        user = User.objects.get(id=access_token["user_id"])
        return user
    except Exception:
        # Если токен протух или невалидный
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    """Middleware, которая перехватывает коннект сокета и достает токен из URL"""

    async def __call__(self, scope, receive, send):
        # Достаем query_string (она приходит в байтах, декодируем в строку)
        query_string = scope.get("query_string", b"").decode("utf-8")

        # Парсим строку (получаем словарь)
        query_parameters = urllib.parse.parse_qs(query_string)

        # Ищем параметр 'token'
        token = query_parameters.get("token")

        if token:
            # token[0] потому что parse_qs возвращает списки
            scope["user"] = await get_user_from_jwt(token[0])
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)
