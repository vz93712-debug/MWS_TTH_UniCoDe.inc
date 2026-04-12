import json
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, parsers
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import APIException
from django.http import StreamingHttpResponse

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
            query_serializer_class=DeleteRecordsQuerySerializer
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
    def get(self, request, dst_id):
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
    """GET /api/v1/mws/datasheets/{dst_id}/attachments/ -> Stream File"""
    def get(self, request, dst_id):
        return self.process_proxy(
            'GET',
            f'/datasheets/{dst_id}/attachments',
            query_serializer_class=AttachmentDownloadQuerySerializer,
            is_file=True
        )

class MWSAttachmentUploadView(BaseMWSProxyView):
    """POST /api/v1/mws/datasheets/{dst_id}/attachments/ -> Upload File"""
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, dst_id):
        # 1. Валидируем только файл из multipart/form-data
        file_serializer = UploadAttachmentSerializer(data=request.data)
        file_serializer.is_valid(raise_exception=True)

        params = {}
        record_id = request.query_params.get('recordId')
        field_id = request.query_params.get('fieldId')

        if record_id and field_id:
            params['recordId'] = record_id
            params['fieldId'] = field_id
        elif record_id or field_id:
            return Response(
                {"detail": "recordId и fieldId должны быть указаны вместе или оба пропущены."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Проксирование запроса в MWS Tables
        try:
            mws_response = MWSClient.request(
                self.request,
                'POST',
                f'/datasheets/{dst_id}/attachments',
                files={'file': file_serializer.validated_data['file']},
                params=params
            )
            return Response(mws_response, status=status.HTTP_201_CREATED)
            
        except APIException as e:
            # Пробрасываем ошибку MWS (400/401/404/503) на фронтенд без изменения статуса
            return Response(e.detail, status=e.status_code)