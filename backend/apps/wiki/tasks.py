import hashlib
import json
from datetime import timedelta

import requests
from apps.users.models import User
from apps.wiki.models import LinkedEntity, WikiPage, WikiPageVersion
from apps.wiki.services.mws_client import MWSClient
from apps.wiki.services.mws_gpt import MWSGPTService, client
from apps.wiki.utils.backlinks import sync_page_links
from apps.wiki.utils.extract_text import extract_text_from_lexical
from apps.wiki.utils.linked_entities import sync_linked_entities
from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer
from django.core.cache import cache
from django.db import transaction
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
            cache.set(
                f"ai_task:{task_id}",
                {"status": "failed", "error": result},
                timeout=TASK_RESULT_TTL,
            )
            return result

        cache.set(
            f"ai_task:{task_id}",
            {"status": "completed", "data": result},
            timeout=TASK_RESULT_TTL,
        )

        return result

    except Exception as e:
        cache.set(
            f"ai_task:{task_id}",
            {"status": "failed", "error": {"message": str(e)}},
            timeout=TASK_RESULT_TTL,
        )
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
        # Опрашиваем только те таблицы, страницы которых были активны недавно
        entities = LinkedEntity.objects.filter(
            entity_type="datasheet", page__updated_at__gte=recent_date
        ).select_related("page")

    client = MWSClient()
    channel_layer = get_channel_layer()

    for entity in entities:
        # ИСПОЛЬЗУЕМ mws_id ИЗ МОДЕЛИ
        fresh_data = client.get_table_data(entity.mws_id)
        if not fresh_data:
            continue

        # Создаем хэш данных для сравнения
        fresh_data_str = json.dumps(fresh_data, sort_keys=True)
        fresh_hash = hashlib.md5(fresh_data_str.encode()).hexdigest()

        # ХРАНИМ ХЭШ В REDIS (вместо БД)
        cache_key = f"mws_sync_hash_{entity.id}"
        last_hash = cache.get(cache_key)

        # Если данные изменились (или мы опрашиваем впервые)
        if last_hash != fresh_hash:
            # Обновляем хэш в кэше на сутки
            cache.set(cache_key, fresh_hash, timeout=86400)

            room_group_name = f"page_{entity.page_id}"
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    "type": "yjs_message",
                    "bytes_data": None,  # Не трогаем Yjs текст
                    "json_data": {
                        "type": "table_update",
                        "entity_id": str(entity.id),
                        "mws_id": entity.mws_id,
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
def smart_import_task(
    self, user_id: int, space_id: str, raw_text: str, file_type: str, title: str = None
):
    """
    Импорт Markdown/HTML через ИИ → создание страницы WikiLive.
    """
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)

    try:
        # 1. Парсинг текста в Lexical JSON
        lexical_json = MWSGPTService.parse_smart_import(raw_text, file_type)

        if "error" in lexical_json:
            cache.set(
                f"ai_task:{task_id}",
                {"status": "failed", "error": lexical_json},
                timeout=TASK_RESULT_TTL,
            )
            return lexical_json

        # 2. Создание страницы
        page_title = title or lexical_json.get("title") or "Импортированный документ"

        with transaction.atomic():
            page = WikiPage.objects.create(
                space_id=space_id,
                title=page_title,
                content=lexical_json,
                created_by_id=user_id,
                updated_by_id=user_id,
            )

        cache.set(
            f"ai_task:{task_id}",
            {
                "status": "completed",
                "data": {"page_id": str(page.id), "title": page.title},
            },
            timeout=TASK_RESULT_TTL,
        )

        return {"status": "completed", "page_id": str(page.id)}

    except Exception as e:
        cache.set(
            f"ai_task:{task_id}",
            {"status": "failed", "error": {"message": str(e)}},
            timeout=TASK_RESULT_TTL,
        )
        return {"error": str(e)}


import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, name="wiki.ai_generate_report")
def generate_report_task(
    self,
    user_id: int,
    dst_id: str,
    space_id: str,
    prompt: str,
    limit: int = 100,
    report_type: str = "summary",
):
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
        fields_resp = requests.get(
            f"{MWS_BASE_URL}/datasheets/{dst_id}/fields", headers=headers, timeout=30
        )

        # Уменьшаем limit до 50 для ускорения, если не передан явно
        effective_limit = limit if limit else 50

        records_resp = requests.get(
            f"{MWS_BASE_URL}/datasheets/{dst_id}/records",
            headers=headers,
            params={"pageSize": effective_limit, "cellFormat": "json"},
            timeout=30,
        )
        fields_resp.raise_for_status()
        records_resp.raise_for_status()

        fields_data = fields_resp.json().get("data", {})
        records_data = records_resp.json().get("data", {})

        # 3. Формируем компактное представление данных для LLM
        table_name = fields_data.get("name", f"Таблица {dst_id}")
        field_names = [
            f.get("name") or f.get("id") for f in fields_data.get("fields", [])
        ]

        # Ограничиваем размер данных (~2000 символов для скорости)
        records_json = json.dumps(records_data.get("records", []), ensure_ascii=False)
        records_truncated = records_json[:2000] + (
            "..." if len(records_json) > 2000 else ""
        )

        data_context = f"Название таблицы: {table_name}\nПоля: {field_names}\nДанные (выборка {effective_limit} записей):\n{records_truncated}"

        # 4. Вызов LLM с увеличенным таймаутом (120 секунд)
        # Используем client.chat.completions.create напрямую, чтобы задать timeout
        try:
            response = client.chat.completions.create(
                model=MWSGPTService.MODEL_INSTRUCT,
                messages=[
                    {
                        "role": "system",
                        "content": MWSGPTService.SYSTEM_REPORT_GENERATOR,
                    },
                    {
                        "role": "user",
                        "content": f"Запрос: {prompt}\nТип: {report_type}\n\nДанные:\n{data_context}",
                    },
                ],
                temperature=0.2,
                max_tokens=4000,  # Уменьшено для ускорения (хватит для отчёта)
                response_format={"type": "json_object"},
                timeout=120.0,  # КРИТИЧНО: Увеличенный таймаут для долгих запросов
            )

            raw_content = response.choices[0].message.content.strip()
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:-3].strip()
            elif raw_content.startswith("```"):
                raw_content = raw_content[3:-3].strip()

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
                updated_by_id=user_id,
            )
            try:
                sync_page_links(page)
                sync_linked_entities(page)
            except Exception as sync_err:
                logger.warning(f"Report sync warning: {sync_err}")

        cache.set(
            f"ai_task:{task_id}",
            {
                "status": "completed",
                "data": {
                    "page_id": str(page.id),
                    "title": page.title,
                    "report_type": report_type,
                },
            },
            timeout=TASK_RESULT_TTL,
        )

        return {"status": "completed", "page_id": str(page.id)}

    except requests.HTTPError as e:
        error_msg = f"MWS API error: {e.response.status_code}"
        cache.set(
            f"ai_task:{task_id}",
            {"status": "failed", "error": error_msg},
            timeout=TASK_RESULT_TTL,
        )
        return {"error": error_msg}
    except Exception as e:
        logger.exception(f"Report generation failed: {e}")
        cache.set(
            f"ai_task:{task_id}",
            {"status": "failed", "error": str(e)},
            timeout=TASK_RESULT_TTL,
        )
        return {"error": str(e)}


@shared_task(bind=True, name="wiki.ai_summarize_page")
def summarize_page_task(self, user_id: int, page_id: str, style: str = "bullets"):
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)

    try:
        page = WikiPage.objects.get(id=page_id)

        # 1. Извлекаем текст из Lexical JSON
        raw_text = extract_text_from_lexical(page.content)
        if not raw_text or len(raw_text) < 50:
            raise ValueError("Страница пуста или слишком коротка")

        # 2. Отправляем в LLM (обрезка до 3000 символов защищает от перегрузки контекста)
        result = MWSGPTService.summarize_content(raw_text, style)

        if "error" in result:
            cache.set(
                f"ai_task:{task_id}",
                {"status": "failed", "error": result},
                timeout=TASK_RESULT_TTL,
            )
            return result

        cache.set(
            f"ai_task:{task_id}",
            {
                "status": "completed",
                "data": {"summary": result["summary"], "page_id": page_id},
            },
            timeout=TASK_RESULT_TTL,
        )

        return {"status": "completed", "summary": result["summary"]}

    except WikiPage.DoesNotExist:
        cache.set(
            f"ai_task:{task_id}",
            {"status": "failed", "error": "Page not found"},
            timeout=TASK_RESULT_TTL,
        )
        return {"error": "Page not found"}
    except Exception as e:
        logger.exception(f"Summarize task failed: {e}")
        cache.set(
            f"ai_task:{task_id}",
            {"status": "failed", "error": str(e)},
            timeout=TASK_RESULT_TTL,
        )
        return {"error": str(e)}


@shared_task(bind=True, name="wiki.ai_explain_diff")
def explain_diff_task(
    self,
    user_id: int,
    page_id: str,
    version_id_from: str = None,
    version_id_to: str = None,
):
    task_id = self.request.id
    cache.set(f"ai_task:{task_id}", {"status": "processing"}, timeout=300)

    try:
        page = WikiPage.objects.get(id=page_id)

        # 1. ОПРЕДЕЛЯЕМ ТЕКСТ Б (Новый) - по умолчанию последняя СОХРАНЕННАЯ версия
        content_b = None
        label_b = ""

        if version_id_to:
            # Если явно указана версия to
            ver_to = WikiPageVersion.objects.get(id=version_id_to, page=page)
            content_b = ver_to.content
            label_b = f"Версия {ver_to.version_number}"
        else:
            # Берем последнюю версию из истории (не page.content!)
            last_version = (
                WikiPageVersion.objects.filter(page=page)
                .order_by("-version_number")
                .first()
            )
            if last_version:
                content_b = last_version.content
                label_b = f"Версия {last_version.version_number}"
            else:
                # Если версий нет вообще — сравниваем с текущим состоянием
                content_b = page.content
                label_b = "Текущая версия (Live)"

        # 2. ОПРЕДЕЛЯЕМ ТЕКСТ А (Старый) - предыдущая версия
        content_a = None
        label_a = ""

        if version_id_from:
            # Если явно указана версия from
            ver_from = WikiPageVersion.objects.get(id=version_id_from, page=page)
            content_a = ver_from.content
            label_a = f"Версия {ver_from.version_number}"
        else:
            # Ищем версию ПЕРЕД version_id_to (или перед последней)
            query = WikiPageVersion.objects.filter(page=page).order_by(
                "-version_number"
            )

            if version_id_to:
                # Если to указан, ищем всё что меньше
                try:
                    ver_to_num = WikiPageVersion.objects.get(
                        id=version_id_to
                    ).version_number
                    query = query.filter(version_number__lt=ver_to_num)
                except WikiPageVersion.DoesNotExist:
                    pass
            else:
                # Если to не указан, пропускаем самую последнюю (она уже в content_b)
                query = query[1:]  # Пропускаем первую (последнюю по номеру)

            prev_version = query.first()
            if prev_version:
                content_a = prev_version.content
                label_a = f"Версия {prev_version.version_number}"
            else:
                # Если предыдущей версии нет — страница создана с нуля
                content_a = {"root": {"children": []}}
                label_a = "Пустая страница (Создание)"

        # 3. ИЗВЛЕКАЕМ ТЕКСТ
        text_a = extract_text_from_lexical(content_a)
        text_b = extract_text_from_lexical(content_b)

        if not text_a and not text_b:
            result_summary = "Обе версии пусты. Изменений нет."
        elif not text_a:
            result_summary = "✅ Страница была создана с нуля."
        elif not text_b:
            result_summary = "❌ Всё содержимое было удалено."
        else:
            # 4. ВЫЗОВ ИИ
            ai_result = MWSGPTService.explain_diff(text_a, text_b)

            if "error" in ai_result:
                raise ValueError(f"AI Error: {ai_result['error']}")

            result_summary = ai_result.get(
                "summary", "Изменений не найдено или они слишком малы."
            )

        # 5. СОХРАНЕНИЕ В КЭШ
        response_data = {
            "status": "completed",
            "data": {
                "summary": result_summary,
                "compared": f"{label_a} → {label_b}",
                "page_id": str(page.id),
            },
        }

        cache.set(f"ai_task:{task_id}", response_data, timeout=TASK_RESULT_TTL)
        return response_data

    except WikiPage.DoesNotExist:
        err = {"status": "failed", "error": "Page not found"}
        cache.set(f"ai_task:{task_id}", err, timeout=TASK_RESULT_TTL)
        return err
    except WikiPageVersion.DoesNotExist:
        err = {"status": "failed", "error": "Version not found"}
        cache.set(f"ai_task:{task_id}", err, timeout=TASK_RESULT_TTL)
        return err
    except Exception as e:
        logger.exception(f"Diff task failed: {e}")
        err = {"status": "failed", "error": str(e)}
        cache.set(f"ai_task:{task_id}", err, timeout=TASK_RESULT_TTL)
        return err


CHAT_SESSION_TTL = 7200  # 2 часа
import time 

@shared_task(bind=True, name="wiki.ai_chat_process")
def ai_chat_process_task(self, user_id: int, page_id: str = None, message: str = "", 
                          session_id: str = None, include_space_context: bool = False):
    """
    Обработка сообщения в AI-чате.
    """
    start_time = time.time()
    
    try:
        # 1. Генерируем или используем существующий session_id
        if not session_id:
            import uuid
            session_id = f"chat_{user_id}_{uuid.uuid4().hex[:8]}"
        
        cache_key = f"chat_session:{session_id}"
        
        # 2. Загружаем историю из Redis
        session_data = cache.get(cache_key)
        if session_data:
            messages_history = json.loads(session_data).get("messages", [])
        else:
            messages_history = []
        
        # 3. Собираем контекст страницы
        page_context = ""
        page_title = ""
        if page_id:
            try:
                page = WikiPage.objects.get(id=page_id)
                page_text = extract_text_from_lexical(page.content)[:3000]
                page_title = page.title
                page_context = f"\n\nКОНТЕКСТ СТРАНИЦЫ: '{page.title}'\n{page_text}"
                
                # Добавляем связанные страницы
                outgoing = page.outgoing_links.all()[:3]
                if outgoing:
                    links_text = ", ".join([p.title for p in outgoing])
                    page_context += f"\n\nСВЯЗАННЫЕ СТРАНИЦЫ: {links_text}"
            except WikiPage.DoesNotExist:
                pass
        
        # 4. Собираем контекст пространства (если запрошено)
        space_context = ""
        if include_space_context and page_id:
            try:
                page = WikiPage.objects.get(id=page_id)
                space_pages = WikiPage.objects.filter(space=page.space).exclude(id=page_id)[:10]
                if space_pages:
                    pages_list = "\n".join([f"- {p.title}" for p in space_pages])
                    space_context = f"\n\nДРУГИЕ СТРАНИЦЫ В ПРОСТРАНСТВЕ '{page.space.name}':\n{pages_list}"
            except:
                pass
        
        # 5. Формируем системный промпт
        system_prompt = f"""Ты — AI-помощник WikiLive, экспертной системы управления знаниями.
Твоя задача — помогать пользователям работать с документами и таблицами.

{page_context}
{space_context}

ПРАВИЛА:
1. Отвечай на русском языке
2. Будь конкретен и полезен
3. Если вопрос про страницу — используй контекст выше
4. Если не знаешь ответа — честно скажи об этом
5. Предлагай полезные действия (создать страницу, таблицу, найти информацию)

Отвечай кратко, но информативно."""
        
        # 6. Добавляем текущее сообщение в историю
        messages_history.append({"role": "user", "content": message})
        
        # 7. Вызов LLM
        ai_response = client.chat.completions.create(
            model=MWSGPTService.MODEL_INSTRUCT,
            messages=[
                {"role": "system", "content": system_prompt},
            ] + messages_history[-10:],  # Последние 10 сообщений для контекста
            temperature=0.7,
            max_tokens=1000
        )
        
        assistant_message = ai_response.choices[0].message.content.strip()
        
        # 8. Сохраняем ответ в историю
        messages_history.append({"role": "assistant", "content": assistant_message})
        
        # 9. Сохраняем сессию в Redis
        cache.set(cache_key, json.dumps({
            "messages": messages_history[-20:],  # Храним последние 20 сообщений
            "page_id": str(page_id) if page_id else None,  # ← КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ
            "last_activity": time.time()
        }), timeout=CHAT_SESSION_TTL)
        
        # 10. Собираем источники
        sources = []
        if page_id:
            sources.append({
                "type": "page",
                "id": page_id,
                "title": page_title
            })
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        return {
            "session_id": session_id,
            "response": assistant_message,
            "sources": sources,
            "latency_ms": latency_ms
        }
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception(f"AI chat error: {e}")
        return {
            "error": str(e),
            "session_id": session_id or "unknown",
            "response": "Произошла ошибка при обработке запроса. Попробуйте позже.",
            "sources": [],
            "latency_ms": int((time.time() - start_time) * 1000)
        }