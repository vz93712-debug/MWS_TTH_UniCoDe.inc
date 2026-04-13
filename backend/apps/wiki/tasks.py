import hashlib
import json
from datetime import timedelta
import requests

from asgiref.sync import async_to_sync
from celery import shared_task
from django.core.cache import cache
from django.db import transaction
from apps.wiki.services.mws_gpt import MWSGPTService, client
from apps.wiki.services.mws_client import MWSClient
from apps.wiki.models import WikiPage, WikiPageVersion, LinkedEntity
from apps.wiki.utils.backlinks import sync_page_links
from apps.wiki.utils.linked_entities import  sync_linked_entities
from apps.users.models import User 

from channels.layers import get_channel_layer
from django.core.cache import cache
from django.db.models import OuterRef
from django.utils import timezone

# TTL для результатов задач в кэше (1 час)
TASK_RESULT_TTL = 3600
MWS_BASE_URL = "https://tables.mws.ru/fusion/v1"


@shared_task(bind=True, name="wiki.ai_generate_table")
def generate_table_task(self, user_id: int, page_id: str, user_prompt: str):
    """Асинхронная генерация таблицы через MWS GPT."""
    try:
        result = MWSGPTService.generate_table_macro(user_prompt)
        
        if "error" in result:
            return {"status": "failed", "error": result}
        
        return {
            "status": "completed",
            "data": result,
            "page_id": page_id
        }
        
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
            cache.set(f"ai_task:{task_id}", {
                "status": "failed",
                "error": result
            }, timeout=TASK_RESULT_TTL)
            return result
        
        cache.set(f"ai_task:{task_id}", {
            "status": "completed",
            "data": result
        }, timeout=TASK_RESULT_TTL)
        
        return result
        
    except Exception as e:
        cache.set(f"ai_task:{task_id}", {
            "status": "failed",
            "error": {"message": str(e)}
        }, timeout=TASK_RESULT_TTL)
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


@shared_task(bind=True, name="wiki.ai_smart_import")
def smart_import_task(self, user_id: int, space_id: str, raw_text: str, file_type: str, title: str = None):
    """
    Импорт Markdown/HTML через ИИ → создание страницы WikiLive.
    """
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)

    try:
        # 1. Парсинг текста в Lexical JSON
        lexical_json = MWSGPTService.parse_smart_import(raw_text, file_type)
        
        if "error" in lexical_json:
            cache.set(f"ai_task:{task_id}", {"status": "failed", "error": lexical_json}, timeout=TASK_RESULT_TTL)
            return lexical_json

        # 2. Создание страницы
        page_title = title or lexical_json.get("title") or "Импортированный документ"
        
        with transaction.atomic():
            page = WikiPage.objects.create(
                space_id=space_id,
                title=page_title,
                content=lexical_json,
                created_by_id=user_id,
                updated_by_id=user_id
            )
            
        cache.set(f"ai_task:{task_id}", {
            "status": "completed",
            "data": {"page_id": str(page.id), "title": page.title}
        }, timeout=TASK_RESULT_TTL)
        
        return {"status": "completed", "page_id": str(page.id)}

    except Exception as e:
        cache.set(f"ai_task:{task_id}", {"status": "failed", "error": {"message": str(e)}}, timeout=TASK_RESULT_TTL)
        return {"error": str(e)}
    

import logging
logger = logging.getLogger(__name__)


@shared_task(bind=True, name="wiki.ai_generate_report")
def generate_report_task(self, user_id: int, dst_id: str, space_id: str, prompt: str, limit: int = 100, report_type: str = "summary"):
    """
    Генерация аналитического отчёта на основе данных MWS Tables.
    """
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)

    try:
        # 1. Получаем токен пользователя
        user = User.objects.get(id=user_id)
        if not user.mws_api_token:
            raise ValueError("У пользователя не привязан MWS API Token")

        headers = {"Authorization": f"Bearer {user.mws_api_token}"}

        # 2. Забираем схему полей и данные из MWS API (Увеличен таймаут до 30с)
        fields_resp = requests.get(f"{MWS_BASE_URL}/datasheets/{dst_id}/fields", headers=headers, timeout=30)
        
        # Уменьшаем limit до 50 для ускорения, если не передан явно
        effective_limit = limit if limit else 50
        
        records_resp = requests.get(
            f"{MWS_BASE_URL}/datasheets/{dst_id}/records",
            headers=headers,
            params={"pageSize": effective_limit, "cellFormat": "json"},
            timeout=30
        )
        fields_resp.raise_for_status()
        records_resp.raise_for_status()

        fields_data = fields_resp.json().get("data", {})
        records_data = records_resp.json().get("data", {})

        # 3. Формируем компактное представление данных для LLM
        table_name = fields_data.get("name", f"Таблица {dst_id}")
        field_names = [f.get("name") or f.get("id") for f in fields_data.get("fields", [])]
        
        # Ограничиваем размер данных (~2000 символов для скорости)
        records_json = json.dumps(records_data.get("records", []), ensure_ascii=False)
        records_truncated = records_json[:2000] + ("..." if len(records_json) > 2000 else "")

        data_context = f"Название таблицы: {table_name}\nПоля: {field_names}\nДанные (выборка {effective_limit} записей):\n{records_truncated}"

        # 4. Вызов LLM с увеличенным таймаутом (120 секунд)
        # Используем client.chat.completions.create напрямую, чтобы задать timeout
        try:
            response = client.chat.completions.create(
                model=MWSGPTService.MODEL_INSTRUCT,
                messages=[
                    {"role": "system", "content": MWSGPTService.SYSTEM_REPORT_GENERATOR},
                    {"role": "user", "content": f"Запрос: {prompt}\nТип: {report_type}\n\nДанные:\n{data_context}"}
                ],
                temperature=0.2,
                max_tokens=4000, # Уменьшено для ускорения (хватит для отчёта)
                response_format={"type": "json_object"},
                timeout=120.0 # КРИТИЧНО: Увеличенный таймаут для долгих запросов
            )
            
            raw_content = response.choices[0].message.content.strip()
            if raw_content.startswith("```json"): raw_content = raw_content[7:-3].strip()
            elif raw_content.startswith("```"): raw_content = raw_content[3:-3].strip()
            
            lexical_json = json.loads(raw_content)
            
        except Exception as e:
            logger.error(f"LLM generation failed or timed out: {e}")
            raise ValueError(f"Ошибка генерации отчёта: {str(e)}")

        # 5. Создание страницы с отчётом
        with transaction.atomic():
            page = WikiPage.objects.create(
                space_id=space_id,
                title=f"Отчёт: {prompt[:30]}...",
                content=lexical_json,
                created_by_id=user_id,
                updated_by_id=user_id
            )
            try:
                sync_page_links(page)
                sync_linked_entities(page)
            except Exception as sync_err:
                logger.warning(f"Report sync warning: {sync_err}")

        cache.set(f"ai_task:{task_id}", {
            "status": "completed",
            "data": {"page_id": str(page.id), "title": page.title, "report_type": report_type}
        }, timeout=TASK_RESULT_TTL)
        
        return {"status": "completed", "page_id": str(page.id)}

    except requests.HTTPError as e:
        error_msg = f"MWS API error: {e.response.status_code}"
        cache.set(f"ai_task:{task_id}", {"status": "failed", "error": error_msg}, timeout=TASK_RESULT_TTL)
        return {"error": error_msg}
    except Exception as e:
        logger.exception(f"Report generation failed: {e}")
        cache.set(f"ai_task:{task_id}", {"status": "failed", "error": str(e)}, timeout=TASK_RESULT_TTL)
        return {"error": str(e)}