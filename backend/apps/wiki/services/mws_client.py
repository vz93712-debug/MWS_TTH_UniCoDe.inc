import logging

import requests
from django.conf import settings
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


class MWSClient:
    # URL по умолчанию, но лучше брать из settings, если есть
    BASE_URL = getattr(settings, "MWS_BASE_URL", "https://tables.mws.ru/fusion/v1")

    def __init__(self, token=None):
        """
        Инициализация клиента для фоновых задач (Celery).
        Если токен передан, он будет использоваться для запросов к MWS.
        """
        self.token = token
        self.headers = {}
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    @staticmethod
    def request(request_obj, method, url_path, return_raw=False, **kwargs):
        """
        Универсальный метод для проксирования HTTP-запросов из Django Views.
        Автоматически достает токен из объекта запроса пользователя.

        Args:
            request_obj - объект Django Request
            method - HTTP метод (GET, POST и тд)
            url_path - путь (например: /spaces/)
            return_raw - если True, возвращает сырой requests.Response (для файлов)
        """
        user = request_obj.user
        if not getattr(user, "mws_api_token", None):
            raise APIException("MWS API Token not configured for this user.")

        headers = {
            "Authorization": f"Bearer {user.mws_api_token}",
        }

        # Добавляем Content-Type ТОЛЬКО если есть тело запроса
        if method.upper() in ["POST", "PATCH", "PUT"]:
            # Для файлов заголовок Content-Type убираем (requests сам выставит boundary)
            if not kwargs.get("files"):
                headers["Content-Type"] = "application/json"

        full_url = f"{MWSClient.BASE_URL}{url_path}"

        try:
            response = requests.request(
                method=method, url=full_url, headers=headers, timeout=30, **kwargs
            )
            response.raise_for_status()

            # Если запрошен сырой ответ (для файлов) - возвращаем response объект
            if return_raw:
                return response

            # Проверяем Content-Type ответа
            content_type = response.headers.get("Content-Type", "")
            if "application/json" not in content_type:
                return response

            return response.json()

        except requests.exceptions.HTTPError as e:
            try:
                error_detail = response.json()
            except Exception:
                error_detail = str(e)
            raise APIException(detail=error_detail, code=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error(f"MWS Proxy Connection Error: {e}")
            raise APIException(detail="MWS Service Unavailable", code=502)

    def get_table_data(self, dst_id: str):
        """
        Получает свежие данные таблицы (первые 100 записей) из MWS API.
        Используется фоновыми задачами (Celery) для проверки обновлений.
        """
        try:
            headers = self.headers.copy()

            # Если токен не был передан при инициализации, пробуем взять системный из настроек
            if "Authorization" not in headers:
                system_token = getattr(settings, "MWS_GPT_API_KEY", None)
                if system_token:
                    headers["Authorization"] = f"Bearer {system_token}"

            full_url = f"{self.BASE_URL}/datasheets/{dst_id}/records"

            response = requests.get(
                full_url,
                headers=headers,
                params={"pageSize": 100, "cellFormat": "json"},
                timeout=15,
            )
            response.raise_for_status()

            result = response.json()
            if result.get("success"):
                return result.get("data", {}).get("records", [])
            return None

        except Exception as e:
            logger.error(f"Ошибка получения данных таблицы {dst_id} в MWSClient: {e}")
            return None
