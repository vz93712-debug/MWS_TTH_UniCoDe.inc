import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "wikilive.settings")

# 1. Инициализируем стандартный Django для HTTP-запросов
# ВАЖНО: это должно вызываться ДО импорта роутов Channels, чтобы загрузились модели БД
django_asgi_app = get_asgi_application()

# 2. Импортируем инструменты Channels и твои сокет-роуты
from apps.wiki.routing import websocket_urlpatterns
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

# 3. Главный маршрутизатор (Traffic Controller)
application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,  # Обычные запросы (REST API, админка) идут сюда
        "websocket": AuthMiddlewareStack(  # Сокеты идут сюда (плюс базовая поддержка сессий/auth)
            URLRouter(websocket_urlpatterns)  # type: ignore
        ),
    }
)
