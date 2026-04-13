from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.core.cache import cache

from apps.wiki.serializers.serializers_ai import SmartImportSerializer
from apps.wiki.tasks import generate_table_task, edit_text_task, smart_import_task
from apps.wiki.services.mws_gpt import MWSGPTService

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