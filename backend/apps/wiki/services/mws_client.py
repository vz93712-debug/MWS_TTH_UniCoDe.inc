import requests
from django.conf import settings
from rest_framework.exceptions import APIException

class MWSClient:
    BASE_URL = "https://tables.mws.ru/fusion/v1"

    @staticmethod
    def request(request_obj, method, url_path, return_raw=False, **kwargs):
        """
        Универсальный метод для проксирования запросов.
        
        Args:
            request_obj - объект Django Request (нужен для получения токена юзера)
            return_raw - если True, возвращает сырой requests.Response (для файлов)
        """
        user = request_obj.user
        if not user.mws_api_token:
            from rest_framework.exceptions import APIException
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
            
            # Если запрошен сырой ответ (для файлов) - возвращаем response объект
            if return_raw:
                return response
            
            # Проверяем Content-Type ответа
            content_type = response.headers.get("Content-Type", "")
            if "application/json" not in content_type:
                return response
            
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            from rest_framework.exceptions import APIException
            try:
                error_detail = response.json()
            except:
                error_detail = str(e)
            raise APIException(detail=error_detail, code=response.status_code)
        except requests.exceptions.RequestException as e:
            from rest_framework.exceptions import APIException
            raise APIException(detail="MWS Service Unavailable", code=502)