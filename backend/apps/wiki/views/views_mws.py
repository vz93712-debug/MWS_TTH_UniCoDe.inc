import json
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from django.http import StreamingHttpResponse
from rest_framework.parsers import MultiPartParser, FormParser
import requests

from apps.wiki.serializers.serializers_mws import *
from apps.wiki.throttles import MWSProxyThrottle
from apps.wiki.services.mws_client import MWSClient

# Время жизни кэша для GET запросов (60 секунд)
CACHE_TIMEOUT = 60


class BaseMWSProxyView(APIView):
    """Базовый класс для всех прокси-эндпоинтов"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [MWSProxyThrottle]
    
    # Вспомогательный метод для генерации ключа кэша
    def get_cache_key(self, path, params=None):
        # Ключ зависит от пути, параметров и (опционально) user_id, если данные персональные
        # Для MWS данные обычно общие для пространства, но чтобы избежать коллизий, добавим user
        params_str = json.dumps(params, sort_keys=True) if params else ""
        return f"mws_proxy:{self.request.user.id}:{path}:{params_str}"

    def process_proxy(self, method, url_path, serializer_class=None, query_serializer_class=None, is_file=False):
        """
        Основная логика проксирования
        """
        # 1. Валидация Query Params (для гибкости объединяем с исходными)
        query_params = self.request.query_params.dict()
        if query_serializer_class:
            qs = query_serializer_class(data=query_params)
            qs.is_valid(raise_exception=True)
            # Merge валидированных данных (snake_case -> camelCase) и "лишних" параметров
            query_params.update({**qs.validated_data, **self.request.query_params})

        # 2. Валидация Body
        body_data = {}
        if serializer_class and method in ['POST', 'PATCH', 'PUT']:
            # Для файлов используем request.data, для JSON - request.data
            serializer = serializer_class(data=self.request.data)
            serializer.is_valid(raise_exception=True)
            body_data = serializer.validated_data
            
            body_data = {k.replace('_', ''): v for k, v in body_data.items() if k != 'record_ids'} # Упрощение

            payload = {}
            for field_name, field in serializer.fields.items():
                val = serializer.validated_data.get(field_name)
                if val is not None:
                    target_key = field.source if field.source != field_name else field_name
                    payload[target_key] = val
            body_data = payload

        # 3. Обработка GET с Кэшированием
        if method == 'GET':
            cache_key = self.get_cache_key(url_path, self.request.query_params)
            cached_response = cache.get(cache_key)
            if cached_response:
                return Response(cached_response)

        # 4. Отправка запроса в MWS
        kwargs = {}
        if method in ['POST', 'PATCH', 'PUT']:
            if is_file:
                # Для файлов body_data - это файл
                kwargs['files'] = body_data
            else:
                kwargs['json'] = body_data
        
        # Передаем params только если они не пустые
        if query_params:
            kwargs['params'] = query_params

        mws_response = MWSClient.request(self.request, method, url_path, **kwargs)

        # 5. Обработка ответа
        if is_file and method == 'GET':
            # Возврат файла (Streaming)
            response = StreamingHttpResponse(
                mws_response.iter_content(chunk_size=8192),
                content_type=mws_response.headers.get('Content-Type', 'application/octet-stream'),
                status=mws_response.status_code
            )
            response['Content-Disposition'] = f'attachment; filename="{url_path.split("/")[-1]}"'
            return response

        # Если JSON ответ
        if method == 'GET':
            cache.set(cache_key, mws_response, timeout=CACHE_TIMEOUT)
            
        return Response(mws_response, status=status.HTTP_200_OK)


# ============================================================================
# 🔹 SPACES & NODES
# ============================================================================

class MWSSpacesView(BaseMWSProxyView):
    """GET /api/v1/mws/spaces/ -> /fusion/v1/spaces"""
    def get(self, request):
        return self.process_proxy('GET', '/spaces')

class MWSNodesView(BaseMWSProxyView):
    """GET /api/v1/mws/nodes/{spaceId}/ -> /fusion/v1/spaces/{spaceId}/nodes"""
    def get(self, request, space_id):
        return self.process_proxy(
            'GET', 
            f'/spaces/{space_id}/nodes',
            query_serializer_class=NodeListQuerySerializer
        )

class MWSNodeDetailView(BaseMWSProxyView):
    """GET /api/v1/mws/nodes/{nodeId}/ -> /fusion/v1/nodes/{nodeId}"""
    def get(self, request, node_id):
        return self.process_proxy('GET', f'/nodes/{node_id}')

# ============================================================================
# 🔹 DATASHEETS (Таблицы)
# ============================================================================

class MWSDatasheetCreateView(BaseMWSProxyView):
    """POST /api/v1/mws/spaces/{space_id}/datasheets/"""
    def post(self, request, space_id):
        return self.process_proxy(
            'POST', 
            f'/spaces/{space_id}/datasheets',
            serializer_class=CreateDatasheetSerializer
        )

class MWSDatasheetDeleteView(BaseMWSProxyView):
    """DELETE /api/v1/mws/spaces/{space_id}/datasheets/{dst_id}/"""
    def delete(self, request, space_id, dst_id):
        return self.process_proxy('DELETE', f'/spaces/{space_id}/datasheet/{dst_id}')

# ============================================================================
# 🔹 RECORDS (Записи)
# ============================================================================

class MWSRecordsView(BaseMWSProxyView):
    """
    GET /api/v1/mws/datasheets/{dst_id}/records/
    POST /api/v1/mws/datasheets/{dst_id}/records/
    PATCH /api/v1/mws/datasheets/{dst_id}/records/
    DELETE /api/v1/mws/datasheets/{dst_id}/records/
    """
    def get(self, request, dst_id):
        return self.process_proxy(
            'GET', 
            f'/datasheets/{dst_id}/records',
            query_serializer_class=GetRecordsQuerySerializer
        )

    def post(self, request, dst_id):
        return self.process_proxy(
            'POST', 
            f'/datasheets/{dst_id}/records',
            serializer_class=CreateRecordsSerializer
        )

    def patch(self, request, dst_id):
        return self.process_proxy(
            'PATCH', 
            f'/datasheets/{dst_id}/records',
            serializer_class=UpdateRecordsSerializer
        )

    def delete(self, request, dst_id):
        return self.process_proxy(
            'DELETE', 
            f'/datasheets/{dst_id}/records',
            serializer_class=DeleteRecordsQuerySerializer
        )

# ============================================================================
# 🔹 FIELDS (Поля)
# ============================================================================

class MWSFieldsView(BaseMWSProxyView):
    """GET /api/v1/mws/datasheets/{dst_id}/fields/"""
    def get(self, request, dst_id):
        return self.process_proxy(
            'GET', 
            f'/datasheets/{dst_id}/fields',
            query_serializer_class=FlexibleQuerySerializer # Пропускаем viewId и прочие
        )

class MWSFieldCreateView(BaseMWSProxyView):
    """POST /api/v1/mws/spaces/{space_id}/datasheets/{dst_id}/fields/"""
    def post(self, request, space_id, dst_id):
        return self.process_proxy(
            'POST',
            f'/spaces/{space_id}/datasheets/{dst_id}/fields',
            serializer_class=CreateFieldSerializer
        )

class MWSFieldDeleteView(BaseMWSProxyView):
    """DELETE /api/v1/mws/spaces/{space_id}/datasheets/{dst_id}/fields/{field_id}/"""
    def delete(self, request, space_id, dst_id, field_id):
        return self.process_proxy('DELETE', f'/spaces/{space_id}/datasheets/{dst_id}/fields/{field_id}')

class MWSFieldIndexView(BaseMWSProxyView):
    """PATCH /api/v1/mws/datasheets/{dst_id}/views/{view_id}/fields/{field_id}/ (change index)"""
    def patch(self, request, dst_id, view_id, field_id):
        return self.process_proxy(
            'PATCH',
            f'/datasheets/{dst_id}/views/{view_id}/fields/{field_id}',
            serializer_class=UpdateFieldIndexSerializer
        )

# ============================================================================
# 🔹 VIEWS (Представления)
# ============================================================================

class MWSViewsView(BaseMWSProxyView):
    """
    GET /api/v1/mws/datasheets/{dst_id}/views/
    POST /api/v1/mws/spaces/{space_id}/datasheets/{dst_id}/views/
    """
    def get(self, request, space_id, dst_id):
        return self.process_proxy('GET', f'/datasheets/{dst_id}/views')

    def post(self, request, space_id, dst_id):
        return self.process_proxy(
            'POST',
            f'/spaces/{space_id}/datasheets/{dst_id}/views',
            serializer_class=CreateViewSerializer
        )

class MWSViewDetailView(BaseMWSProxyView):
    """
    DELETE /api/v1/mws/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}/
    PUT /api/v1/mws/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}/ (update name)
    """
    def delete(self, request, space_id, dst_id, view_id):
        return self.process_proxy('DELETE', f'/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}')

    def put(self, request, space_id, dst_id, view_id):
        return self.process_proxy(
            'PUT',
            f'/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}',
            serializer_class=UpdateViewNameSerializer
        )

# Sort, Group, Hidden, Move 
class MWSViewSortView(BaseMWSProxyView):
    def post(self, request, space_id, dst_id, view_id):
        return self.process_proxy(
            'POST', f'/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}/sort',
            serializer_class=ViewSortSerializer
        )

class MWSViewGroupView(BaseMWSProxyView):
    def post(self, request, space_id, dst_id, view_id):
        return self.process_proxy(
            'POST', f'/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}/group',
            serializer_class=ViewGroupSerializer
        )
    
class MWSViewHiddenView(BaseMWSProxyView):
    def post(self, request, space_id, dst_id, view_id):
        return self.process_proxy(
            'POST', f'/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}/hidden',
            serializer_class=ViewHideFieldsSerializer
        )
    
class MWSViewMoveView(BaseMWSProxyView):
    def post(self, request, space_id, dst_id, view_id):
        return self.process_proxy(
            'POST', f'/spaces/{space_id}/datasheets/{dst_id}/views/{view_id}/move',
            serializer_class=ViewMoveSerializer
        )

# ============================================================================
# 🔹 ATTACHMENTS (Вложения)
# ============================================================================

class MWSAttachmentDownloadView(BaseMWSProxyView):
    """GET /api/v1/mws/datasheets/{dst_id}/attachments/?token=... -> Stream File"""
    
    def get(self, request, dst_id):
        from rest_framework.exceptions import APIException
        
        serializer = AttachmentDownloadQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        url_path = f'/datasheets/{dst_id}/attachments'
        params = {'token': token}
        
        try:
            # Делаем запрос к MWS
            mws_response = MWSClient.request(
                self.request, 
                'GET', 
                url_path,
                params=params,
                return_raw=True
            )
            
            # ПРОВЕРКА: если MWS вернул ошибку
            if mws_response.status_code != 200:
                print(f"❌ MWS Error: {mws_response.status_code}")
                print(f"❌ MWS Body: {mws_response.text}")
                raise APIException(
                    detail=f"MWS API error: {mws_response.text}", 
                    code=mws_response.status_code
                )
            
            # Проверяем Content-Type
            content_type = mws_response.headers.get('Content-Type', '')
            print(f"✅ MWS Content-Type: {content_type}")
            print(f"✅ MWS Content-Length: {mws_response.headers.get('Content-Length')}")
            
            # Если это не бинарный файл — возвращаем ошибку
            if 'application/json' in content_type:
                # MWS вернул JSON вместо файла
                error_data = mws_response.json()
                print(f"❌ MWS returned JSON error: {error_data}")
                raise APIException(detail=f"MWS error: {error_data}", code=400)
            
            # Возвращаем файл
            response = StreamingHttpResponse(
                mws_response.iter_content(chunk_size=8192),
                content_type=content_type,
                status=mws_response.status_code
            )
            
            filename = token.split('/')[-1] if '/' in token else 'file'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            if 'Content-Length' in mws_response.headers:
                response['Content-Length'] = mws_response.headers['Content-Length']
            
            return response
            
        except Exception as e:
            print(f"❌ Exception in download: {e}")
            import traceback
            traceback.print_exc()
            raise
    

class MWSAttachmentUploadView(APIView):
    """POST /api/v1/mws/datasheets/{dst_id}/attachments/upload/"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, dst_id):
        # Логирование для отладки        
        # Получаем файл
        if not request.FILES:
            return Response(
                {"detail": "No files in request.FILES"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response(
                {"detail": "File field 'file' not found. Available keys: " + str(list(request.FILES.keys()))}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем пользователя и токен
        user = request.user
        if not hasattr(user, 'mws_api_token') or not user.mws_api_token:
            return Response(
                {"detail": "MWS API token not configured"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Параметры запроса
        params = {}
        if request.query_params.get('recordId'):
            params['recordId'] = request.query_params.get('recordId')
        if request.query_params.get('fieldId'):
            params['fieldId'] = request.query_params.get('fieldId')
        
        # Заголовки для MWS
        headers = {
            "Authorization": f"Bearer {user.mws_api_token}"
        }
        
        # Файл для отправки
        files = {
            'file': (uploaded_file.name, uploaded_file, uploaded_file.content_type)
        }
        
        # Отправка в MWS
        mws_url = f"https://tables.mws.ru/fusion/v1/datasheets/{dst_id}/attachments"
        
        try:
            response = requests.post(
                mws_url,
                headers=headers,
                files=files,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            return Response(response.json(), status=status.HTTP_201_CREATED)
            
        except requests.exceptions.RequestException as e:
            return Response(
                {"detail": f"MWS API error: {str(e)}"}, 
                status=status.HTTP_502_BAD_GATEWAY
            )