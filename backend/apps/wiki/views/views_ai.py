from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.core.cache import cache

from apps.wiki.serializers.serializers_ai import SmartImportSerializer, ReportGenerationSerializer, PageSummarizeSerializer, DiffExplainSerializer
from apps.wiki.tasks import generate_table_task, edit_text_task, smart_import_task, generate_report_task, summarize_page_task, explain_diff_task
from apps.wiki.services.mws_gpt import MWSGPTService
from apps.wiki.permissions import IsSpaceOrPageMember

from celery.result import AsyncResult


class AITableGenerateView(APIView):
    """
    POST /api/v1/ai/generate-table/
    
    Запускает асинхронную генерацию таблицы.
    Возвращает task_id для отслеживания статуса.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user_prompt = request.data.get("prompt", "").strip()
        page_id = request.data.get("page_id")
        
        if not user_prompt:
            return Response(
                {"error": "Prompt is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Запускаем задачу в фоне
        task = generate_table_task.delay(
            user_id=request.user.id,
            page_id=page_id,
            user_prompt=user_prompt
        )
        
        return Response({
            "task_id": task.id,
            "status": "queued",
            "message": "Запрос отправлен в обработку"
        }, status=status.HTTP_202_ACCEPTED)


class AITaskStatusView(APIView):
    """
    GET /api/v1/ai/tasks/{task_id}/
    Получение статуса задачи через Celery AsyncResult.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, task_id):
        task = AsyncResult(task_id)
        
        if task.state == "PENDING":
            return Response({"status": "queued", "message": "Задача в очереди"})
        
        elif task.state == "STARTED":
            return Response({"status": "processing", "message": "ИИ генерирует ответ..."})
        
        elif task.state == "SUCCESS":
            # task.result содержит то, что вернула задача
            result = task.result
            if isinstance(result, dict) and result.get("status") == "completed":
                return Response(result)
            return Response({"status": "completed", "data": result})
        
        elif task.state == "FAILURE":
            error_info = str(task.info) if task.info else "Неизвестная ошибка"
            return Response({
                "status": "failed",
                "error": {"message": error_info}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            return Response({"status": "unknown", "state": task.state}, status=404)
        

class AIEditTextView(APIView):
    """
    POST /api/v1/ai/edit-text/
    
    Асинхронное редактирование выделенного текста.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        text = request.data.get("text", "").strip()
        action = request.data.get("action")  # shorten|formalize|fix|expand
        context = request.data.get("context", "")
        
        if not text or not action:
            return Response(
                {"error": "text and action are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task = edit_text_task.delay(
            user_id=request.user.id,
            text=text,
            action=action,
            context=context
        )
        
        return Response({
            "task_id": task.id,
            "status": "queued"
        }, status=status.HTTP_202_ACCEPTED)


class AISmartImportView(APIView):
    """
    POST /api/v1/ai/smart-import/
    Запускает асинхронный импорт документа через ИИ.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SmartImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = smart_import_task.delay(
            user_id=request.user.id,
            space_id=serializer.validated_data['space_id'],
            raw_text=serializer.validated_data['content'],
            file_type=serializer.validated_data['file_type'],
            title=serializer.validated_data.get('title')
        )

        return Response({
            "task_id": task.id,
            "status": "queued",
            "message": "Импорт запущен. Ожидайте завершения."
        }, status=status.HTTP_202_ACCEPTED)
    

class AIReportGenerateView(APIView):
    """
    POST /api/v1/ai/generate-report/
    Запускает асинхронную генерацию отчёта на основе данных таблицы MWS.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReportGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = generate_report_task.delay(
            user_id=request.user.id,
            dst_id=serializer.validated_data['dst_id'],
            space_id=serializer.validated_data['space_id'],
            prompt=serializer.validated_data['prompt'],
            limit=serializer.validated_data.get('limit', 100),
            report_type=serializer.validated_data.get('report_type', 'summary')
        )

        return Response({
            "task_id": task.id,
            "status": "queued",
            "message": "Генерация отчёта запущена. Данные запрашиваются из MWS Tables."
        }, status=status.HTTP_202_ACCEPTED)
    

class AISummarizePageView(APIView):
    """
    POST /api/v1/ai/summarize-page/
    Запускает асинхронное сжатие содержимого страницы.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PageSummarizeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = summarize_page_task.delay(
            user_id=request.user.id,
            page_id=serializer.validated_data['page_id'],
            style=serializer.validated_data.get('style', 'bullets')
        )

        return Response({
            "task_id": task.id,
            "status": "queued",
            "message": "Сжатие запущено. Ожидайте завершения."
        }, status=status.HTTP_202_ACCEPTED)
    

class AIDiffExplainView(APIView):
    """
    POST /api/v1/ai/explain-diff/
    Запускает асинхронное объяснение изменений между версиями.
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember] # Используем твой класс прав

    def post(self, request):
        serializer = DiffExplainSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = explain_diff_task.delay(
            user_id=request.user.id,
            page_id=serializer.validated_data['page_id'],
            version_id_from=serializer.validated_data.get('version_id_from'),
            version_id_to=serializer.validated_data.get('version_id_to')
        )

        return Response({
            "task_id": task.id,
            "status": "queued",
            "message": "Анализ изменений запущен."
        }, status=status.HTTP_202_ACCEPTED)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from ..serializers.serializers_ai import (
    AIChatRequestSerializer, 
    AIChatResponseSerializer,
    AIChatHistorySerializer
)
from ..tasks import ai_chat_process_task
from django.core.cache import cache
import json


class AIChatView(APIView):
    """
    POST /api/v1/ai/chat/
    
    AI-чат для работы с документами.
    Поддерживает контекст страницы и историю диалога.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Запускаем асинхронную задачу
        task = ai_chat_process_task.delay(
            user_id=request.user.id,
            page_id=serializer.validated_data.get('page_id'),
            message=serializer.validated_data['message'],
            session_id=serializer.validated_data.get('session_id'),
            include_space_context=serializer.validated_data.get('include_space_context', False)
        )
        
        # Для чата лучше использовать синхронный ответ (ждем 5-10 сек)
        # Или можно вернуть task_id и polling, но это хуже UX
        result = task.get(timeout=30)  # Ждем максимум 30 секунд
        
        response_serializer = AIChatResponseSerializer(result)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class AIChatHistoryView(APIView):
    """
    GET /api/v1/ai/chat/history/{session_id}/
    
    Получение истории сессии чата.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, session_id):
        cache_key = f"chat_session:{session_id}"
        session_data = cache.get(cache_key)
        
        if not session_data:
            return Response(
                {"error": "Session not found or expired"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = json.loads(session_data)
        
        # Проверяем, что сессия принадлежит пользователю
        # (session_id содержит user_id)
        if str(request.user.id) not in session_id:
            return Response(
                {"error": "Access denied"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            "session_id": session_id,
            "messages": data.get("messages", []),
            "page_id": data.get("page_id"),
            "last_activity": data.get("last_activity")
        })


class AIChatSessionsView(APIView):
    """
    GET /api/v1/ai/chat/sessions/
    DELETE /api/v1/ai/chat/sessions/{session_id}/
    
    Управление сессиями чата.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Получаем все активные сессии пользователя
        pattern = f"chat_session:{request.user.id}*"
        keys = cache.keys(pattern)
        
        sessions = []
        for key in keys:
            session_id = key.replace("chat_session:", "")
            data = cache.get(key)
            if data:
                session_data = json.loads(data)
                sessions.append({
                    "session_id": session_id,
                    "last_activity": session_data.get("last_activity"),
                    "message_count": len(session_data.get("messages", [])),
                    "page_id": session_data.get("page_id")
                })
        
        # Сортируем по last_activity
        sessions.sort(key=lambda x: x["last_activity"], reverse=True)
        
        return Response({"sessions": sessions})
    
    def delete(self, request, session_id=None):
        if session_id:
            # Удаляем конкретную сессию
            cache_key = f"chat_session:{session_id}"
            if cache.delete(cache_key):
                return Response({"status": "deleted"})
            else:
                return Response(
                    {"error": "Session not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Удаляем все сессии пользователя
            pattern = f"chat_session:{request.user.id}*"
            keys = cache.keys(pattern)
            cache.delete_many(keys)
            return Response({"status": "all_deleted", "count": len(keys)})