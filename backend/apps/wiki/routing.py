from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    # Перехватываем WebSocket-соединения для конкретной страницы
    re_path(r"^ws/pages/(?P<page_id>[\w-]+)/?$", consumers.WikiPageConsumer.as_asgi()),
]
