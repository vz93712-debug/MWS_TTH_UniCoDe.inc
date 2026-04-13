import json
import logging
from typing import Optional, Union
from openai import OpenAI, APIError, APITimeoutError, RateLimitError
from django.conf import settings

logger = logging.getLogger(__name__)

# Инициализация клиента один раз при импорте
client = OpenAI(
    api_key=settings.MWS_GPT_API_KEY,
    base_url=settings.MWS_GPT_BASE_URL,
    timeout=30.0,  # Таймаут 30 секунд
    max_retries=3  # Автоматические ретраи при ошибках
)


class MWSGPTService:
    """Сервис для работы с MWS GPT API"""
    
    # === МОДЕЛИ ===
    MODEL_CODER = "qwen3-coder-480b-a35b"      # Для генерации структурированных данных
    MODEL_INSTRUCT = "qwen2.5-72b-instruct"     # Для работы с текстом
    MODEL_EMBEDDING = "bge-m3"                   # Для векторных представлений
    
    # === ШАБЛОНЫ ПРОМПТОВ ===
    SYSTEM_TABLE_GENERATOR = """Ты — парсер структур данных для MWS Tables.
Твоя задача: преобразовать запрос пользователя в строгий JSON-макрос таблицы.

## ПРАВИЛА
1. Возвращай ТОЛЬКО валидный JSON. Без пояснений, без markdown, без текста до/после.
2. Начинай ответ с `{` и заканчивай `}`.
3. Если запрос неясен — верни минимальную таблицу с полем "Название" типа `SingleText`.

## СТРУКТУРА ОТВЕТА
{
  "name": "string",
  "description": "string",
  "fields": [
    {
      "name": "string",
      "type": "FieldType",
      "property": { ... } // только если требуется для типа
    }
  ]
}

## ДОСТУПНЫЕ ТИПЫ ПОЛЕЙ

### 🔤 Текстовые
• `SingleText` — короткая строка
  { "type": "SingleText", "property": { "defaultValue": "" } }
• `Text` — длинный текст (многострочный)
  { "type": "Text" }

### 🔢 Числовые
• `Number` — число с настройками
  { "type": "Number", "property": { "precision": 0, "symbol": "" } }
  // precision: 0-4 (знаков после запятой), symbol: единица измерения, commaStyle: разделитель тысяч
• `Currency` — валюта
  { "type": "Currency", "property": { "precision": 2, "symbol": "₽", "symbolAlign": "Default" } }
  // symbolAlign: "Default" | "Left" | "Right"
• `Percent` — процент
  { "type": "Percent", "property": { "precision": 0 } }

### 📅 Дата и время
• `DateTime` — дата/время
  { "type": "DateTime", "property": { "dateFormat": "YYYY-MM-DD", "includeTime": false, "autoFill": true } }
  // dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "YYYY/MM/DD" | "MM-DD" | "YYYY"
  // includeTime: показывать время, autoFill: автозаполнение при создании

### ✅ Выбор и флаги
• `SingleSelect` — выпадающий список (один вариант)
  { "type": "SingleSelect", "property": { "options": [
    { "name": "Новая", "color": "blue" }
  ]}}
  // color: "blue"|"green"|"red"|"yellow"|"gray"|"purple"|"indigo"
• `MultiSelect` — множественный выбор (формат как у SingleSelect)
  { "type": "MultiSelect", "property": { "options": [...] } }
• `Checkbox` — галочка
  { "type": "Checkbox", "property": { "icon": "white_check_mark" } }
  // icon: "white_check_mark"|"check"|"x"|"star"
• `Rating` — оценка звёздами
  { "type": "Rating", "property": { "icon": "star", "max": 5 } }
  // max: 1-10, icon: "star"|"heart"|"thumb_up"

### 👥 Люди и файлы
• `Member` — выбор пользователя
  { "type": "Member", "property": { "isMulti": false, "shouldSendMsg": false } }
  // isMulti: несколько пользователей, shouldSendMsg: уведомлять при упоминании
• `Attachment` — вложение файла
  { "type": "Attachment" }

### 🔗 Ссылки
• `URL` — веб-ссылка
  { "type": "URL" }
• `Email` — email-адрес
  { "type": "Email" }
• `Phone` — телефон
  { "type": "Phone" }

## ПРИМЕРЫ

Запрос: "Таблица задач с исполнителем и статусом"
Ответ:
{
  "table_name": "Задачи",
  "description": "Трекер задач команды",
  "fields": [
    {"name": "Название", "type": "SingleText", "property": {"defaultValue": ""}},
    {"name": "Описание", "type": "Text"},
    {"name": "Статус", "type": "SingleSelect", "property": {"options": [
      {"name": "Новая", "color": "blue"},
      {"name": "В работе", "color": "yellow"},
      {"name": "Готово", "color": "green"}
    ]}},
    {"name": "Исполнитель", "type": "Member", "property": {"isMulti": false}},
    {"name": "Дедлайн", "type": "DateTime", "property": {"dateFormat": "YYYY-MM-DD", "includeTime": false}},
    {"name": "Приоритет", "type": "Rating", "property": {"icon": "star", "max": 5}}
  ]
}

Запрос: "Бюджет проекта"
Ответ:
{
  "table_name": "Бюджет проекта",
  "description": "Финансовое планирование",
  "fields": [
    {"name": "Статья", "type": "SingleText", "property": {"defaultValue": ""}},
    {"name": "План", "type": "Currency", "property": {"precision": 2, "symbol": "₽", "symbolAlign": "Default"}},
    {"name": "Факт", "type": "Currency", "property": {"precision": 2, "symbol": "₽", "symbolAlign": "Default"}},
    {"name": "Отклонение %", "type": "Percent", "property": {"precision": 1}},
    {"name": "Документ", "type": "Attachment"},
    {"name": "Создано", "type": "DateTime", "property": {"dateFormat": "YYYY-MM-DD", "autoFill": true}}
  ]
}

Запрос: "Список контактов"
Ответ:
{
  "table_name": "Контакты",
  "description": "База клиентов",
  "fields": [
    {"name": "Имя", "type": "SingleText", "property": {"defaultValue": ""}},
    {"name": "Компания", "type": "SingleText", "property": {"defaultValue": ""}},
    {"name": "Email", "type": "Email"},
    {"name": "Телефон", "type": "Phone"},
    {"name": "Сайт", "type": "URL"},
    {"name": "Статус", "type": "SingleSelect", "property": {"options": [
      {"name": "Новый", "color": "blue"},
      {"name": "В работе", "color": "yellow"},
      {"name": "Клиент", "color": "green"}
    ]}}
  ]
}

## ВАЖНО
• Для `SingleSelect`/`MultiSelect` всегда указывай минимум 3 варианта в `options`.
• Для `Currency` по умолчанию используй символ "₽" и `symbolAlign: "Default"`.
• Для `DateTime` по умолчанию: `dateFormat: "YYYY-MM-DD"`, `includeTime: false`, `autoFill: true`.
• Не добавляй поля, которые не запрошены пользователем.

НЕ добавляй ничего кроме JSON. Начинай ответ с { и заканчивай }."""

    SYSTEM_TEXT_EDITOR = """Ты — профессиональный редактор текстов.
Твоя задача: улучшить текст согласно инструкции пользователя.

ПРАВИЛА:
1. Возвращай ТОЛЬКО изменённый текст, без пояснений.
2. Сохраняй исходный смысл, если не указано иное.
3. Для действия "shorten" — сократи до 1-2 предложений.
4. Для действия "formalize" — используй официально-деловой стиль.
5. Для действия "fix" — исправь орфографию, пунктуацию, грамматику."""

    SYSTEM_SMART_IMPORT = """Ты — строгий конвертер документов в формат Lexical JSON.
Твоя задача: преобразовать исходный Markdown/HTML в валидный Lexical EditorState JSON.

🔴 ЖЁСТКИЕ ПРАВИЛА:
1. СОХРАНЯЙ 100% ИСХОДНОГО ТЕКСТА. Никаких сокращений, перефразирований, добавлений или удаления информации.
2. СТРУКТУРА ДОЛЖНА СОВПАДАТЬ 1:1. Заголовки → заголовки, списки → списки, код → код.
3. Возвращай ТОЛЬКО валидный JSON. Без пояснений, без markdown-обёрток, без текста до/после.
4. Используй стандартную схему Lexical EditorState:
{
  "root": {
    "type": "root",
    "children": [ ...nodes... ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "version": 1
  }
}

📐 МАППИНГ УЗЛОВ:
• Текст/Параграф → {"type": "paragraph", "children": [{"type": "text", "text": "...", "format": 0, "mode": "normal", "style": "", "version": 1}]}
• Заголовки (#, ##, ###) → {"type": "heading", "level": N, "children": [...]}
• Маркированный список (-, *) → {"type": "list", "listType": "bullet", "children": [{"type": "listitem", "value": N, "children": [...]}]}
• Нумерованный список (1., 2.) → {"type": "list", "listType": "number", "children": [...]}
• Жирный → "format": 1, Курсив → "format": 2, Код → "format": 16
• Ссылки [text](url) → {"type": "link", "url": "...", "children": [{"type": "text", "text": "...", "format": 0}]}
• Картинки ![alt](url) → {"type": "image", "src": "...", "alt": "...", "width": 800, "height": 600, "maxWidth": "100%"}
• Таблицы |...| → {"type": "table", "children": [{"type": "tablerow", "children": [{"type": "tablecell", "colSpan": 1, "rowSpan": 1, "headerState": 1, "children": [...]}]}]}
• Код-блоки ``` → {"type": "code", "language": "...", "children": [{"type": "text", "text": "...", "format": 0}]}

⚠️ ВАЖНО:
• Если элемент не распознан, помести его в "paragraph" как есть.
• Не добавляй поля, которых нет в схеме.
• Начинай ответ с { и заканчивай }."""

    @classmethod
    def generate_table_macro(cls, user_prompt: str) -> dict:
        """
        Генерирует JSON-макрос таблицы MWS по текстовому запросу.
        
        Returns:
            dict: { "table_name": "...", "fields": [...], ... } или { "error": "..." }
        """
        try:
            response = client.chat.completions.create(
                model=cls.MODEL_CODER,
                messages=[
                    {"role": "system", "content": cls.SYSTEM_TABLE_GENERATOR},
                    {"role": "user", "content": f"Запрос пользователя: {user_prompt}"}
                ],
                temperature=0.1,  # Минимальная креативность для строгости
                max_tokens=2000,
                response_format={"type": "json_object"}  # Требуем строго JSON
            )
            
            raw_content = response.choices[0].message.content.strip()
            
            # Убираем возможные markdown-обёртки, если модель их добавила
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:-3].strip()
            elif raw_content.startswith("```"):
                raw_content = raw_content[3:-3].strip()
                
            return json.loads(raw_content)
            
        except APITimeoutError:
            logger.error("MWS GPT timeout")
            return {"error": "timeout", "message": "Сервис не ответил вовремя"}
        except RateLimitError:
            logger.error("MWS GPT rate limit")
            return {"error": "rate_limit", "message": "Превышен лимит запросов"}
        except APIError as e:
            logger.error(f"MWS GPT API error: {e}")
            return {"error": "api_error", "message": str(e)}
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}, raw: {raw_content[:200]}")
            return {"error": "parse_error", "message": "Невалидный JSON от модели", "raw": raw_content[:500]}
        except Exception as e:
            logger.exception(f"Unexpected error: {e}")
            return {"error": "unknown", "message": "Неизвестная ошибка"}

    @classmethod
    def edit_text(cls, text: str, action: str, context: Optional[str] = None) -> dict:
        """
        Редактирует текст согласно действию.
        
        Args:
            text: Исходный текст
            action: "shorten" | "formalize" | "fix" | "expand"
            context: Опциональный контекст (например, тема документа)
            
        Returns:
            dict: { "result": "изменённый текст" } или { "error": "..." }
        """
        action_descriptions = {
            "shorten": "Сократи текст до 1-2 предложений, сохранив главную мысль.",
            "formalize": "Перепиши текст в официально-деловом стиле.",
            "fix": "Исправь орфографию, пунктуацию и грамматику.",
            "expand": "Расширь текст, добавив детали."
        }
        
        instruction = action_descriptions.get(action, "Улучши текст.")
        if context:
            instruction += f"\nКонтекст: {context}"
        
        try:
            response = client.chat.completions.create(
                model=cls.MODEL_INSTRUCT,
                messages=[
                    {"role": "system", "content": cls.SYSTEM_TEXT_EDITOR},
                    {"role": "user", "content": f"{instruction}\n\nИсходный текст:\n{text}"}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            return {"result": response.choices[0].message.content.strip()}
            
        except Exception as e:
            logger.error(f"Text edit error: {e}")
            return {"error": "edit_failed", "message": str(e)}

    @classmethod
    def get_embedding(cls, text: str) -> list:
        """Получает векторное представление текста для семантического поиска."""
        try:
            response = client.embeddings.create(
                model=cls.MODEL_EMBEDDING,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return []
        
    @classmethod
    def parse_smart_import(cls, raw_text: str, file_type: str = "markdown") -> dict:
        """
        Конвертирует Markdown/HTML в Lexical JSON с сохранением 100% контента.
        """
        try:
            response = client.chat.completions.create(
                model=cls.MODEL_INSTRUCT,  # qwen2.5-72b-instruct лучше для текста
                messages=[
                    {"role": "system", "content": cls.SYSTEM_SMART_IMPORT},
                    {"role": "user", "content": f"Формат входных данных: {file_type}\n\nИсходный текст:\n{raw_text}"}
                ],
                temperature=0.0,  # Строгая детерминированность
                max_tokens=12000, # Для больших документов
                response_format={"type": "json_object"}
            )
            
            raw_content = response.choices[0].message.content.strip()
            
            # Очистка от возможных markdown-обёрток
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:-3].strip()
            elif raw_content.startswith("```"):
                raw_content = raw_content[3:-3].strip()
                
            return json.loads(raw_content)
            
        except json.JSONDecodeError as e:
            logger.error(f"Smart import JSON parse error: {e}")
            return {"error": "parse_error", "raw": raw_content[:500]}
        except Exception as e:
            logger.error(f"Smart import error: {e}")
            return {"error": str(e)}