import requests
from django.conf import settings
from rest_framework.exceptions import APIException

class MWSClient:
    BASE_URL = "https://tables.mws.ru/fusion/v1"

    @staticmethod
    def request(request_obj, method, url_path, **kwargs):
        """
        Универсальный метод для проксирования запросов.
        request_obj - объект Django Request (нужен для получения токена юзера)
        """
        user = request_obj.user
        if not user.mws_api_token:
            raise APIException("MWS API Token not configured for this user.")

        headers = {
            "Authorization": f"Bearer {user.mws_api_token}",
            "Content-Type": "application/json",
        }
        
        # Для файлов заголовок Content-Type убираем (requests сам выставит boundary)
        if kwargs.get('files'):
            headers.pop("Content-Type")

        full_url = f"{MWSClient.BASE_URL}{url_path}"
        
        try:
            response = requests.request(
                method=method,
                url=full_url,
                headers=headers,
                timeout=30,
                **kwargs
            )
            response.raise_for_status()
            
            # Если ответ бинарный (файл), возвращаем его как есть
            if "application/json" not in response.headers.get("Content-Type", ""):
                return response
            
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            # Пробрасываем ошибку MWS на фронтенд
            raise APIException(detail=response.json() if response.text else str(e), code=response.status_code)
        except requests.exceptions.RequestException as e:
            raise APIException(detail="MWS Service Unavailable", code=502)