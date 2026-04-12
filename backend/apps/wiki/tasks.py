import hashlib
import json
from datetime import timedelta

# Подключаем модели и сервисы
from apps.wiki.models import LinkedEntity, WikiPageVersion
from apps.wiki.services.mws_client import MWSClient
from apps.wiki.services.mws_gpt import MWSGPTService
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.core.cache import cache
from django.db.models import OuterRef
from django.utils import timezone

# TTL для результатов задач в кэше (1 час)
TASK_RESULT_TTL = 3600


@shared_task(bind=True, name="wiki.ai_generate_table")
def generate_table_task(self, user_id: int, page_id: str, user_prompt: str):
    """Асинхронная генерация таблицы через MWS GPT."""
    try:
        result = MWSGPTService.generate_table_macro(user_prompt)
        if "error" in result:
            return {"status": "failed", "error": result}
        return {"status": "completed", "data": result, "page_id": page_id}
    except Exception as e:
        return {"status": "failed", "error": {"message": str(e)}}


@shared_task(bind=True, name="wiki.ai_edit_text")
def edit_text_task(self, user_id: int, text: str, action: str, context: str = None):
    """Асинхронное редактирование текста через MWS GPT."""
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)
    try:
        result = MWSGPTService.edit_text(text, action, context)
        if "error" in result:
            status_data = {"status": "failed", "error": result}
        else:
            status_data = {"status": "completed", "data": result}

        cache.set(f"ai_task:{task_id}", status_data, timeout=TASK_RESULT_TTL)
        return result
    except Exception as e:
        error_data = {"status": "failed", "error": {"message": str(e)}}
        cache.set(f"ai_task:{task_id}", error_data, timeout=TASK_RESULT_TTL)
        return {"error": str(e)}


@shared_task(bind=True, name="wiki.poll_mws_tables")
def poll_mws_tables_task(self, page_id: str = None):
    """Опрос MWS API для проверки изменений в связанных таблицах."""
    if page_id:
        entities = LinkedEntity.objects.filter(
            page_id=page_id, entity_type="datasheet"
        ).select_related("page")
    else:
        recent_date = timezone.now() - timedelta(days=7)
        entities = LinkedEntity.objects.filter(
            entity_type="datasheet", page__updated_at__gte=recent_date
        ).select_related("page")

    client = MWSClient()
    channel_layer = get_channel_layer()

    for entity in entities:
        fresh_data = client.get_table_data(entity.external_id)
        if not fresh_data:
            continue

        fresh_data_str = json.dumps(fresh_data, sort_keys=True)
        fresh_hash = hashlib.md5(fresh_data_str.encode()).hexdigest()

        if entity.last_sync_hash != fresh_hash:
            entity.last_sync_hash = fresh_hash
            entity.save(update_fields=["last_sync_hash", "updated_at"])
            room_group_name = f"page_{entity.page_id}"
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "yjs_message",
                    "bytes_data": None,
                    "json_data": {
                        "type": "table_update",
                        "entity_id": str(entity.id),
                        "data": fresh_data,
                    },
                    "sender_channel_name": "celery_worker",
                },
            )


@shared_task(bind=True, name="wiki.cleanup_old_versions")
def cleanup_old_versions_task(self, max_versions: int = 50):
    """Оставляет только N последних версий."""
    old_versions_qs = (
        WikiPageVersion.objects.filter(page=OuterRef("page"))
        .order_by("-version_number")[max_versions:]
        .values("id")
    )
    old_versions = WikiPageVersion.objects.filter(id__in=old_versions_qs)
    deleted_count, _ = old_versions.delete()
    return {"deleted_versions": deleted_count}


@shared_task(bind=True, name="wiki.cleanup_ai_tasks")
def cleanup_ai_tasks_task(self, ttl_hours: int = 24):
    """Очистка результатов задач."""
    try:
        from django_celery_results.models import TaskResult

        expiration_date = timezone.now() - timedelta(hours=ttl_hours)
        old_tasks = TaskResult.objects.filter(
            date_done__lt=expiration_date, status__in=["SUCCESS", "FAILURE", "REVOKED"]
        )
        deleted_count, _ = old_tasks.delete()
        return {"deleted_ai_tasks": deleted_count}
    except ImportError:
        return {"error": "django_celery_results не установлен"}
