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
    timeout=300.0,  # Таймаут 30 секунд
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
4. Используй стандартную схему Lexical EditorState (см. ниже).

📐 СТРУКТУРА ROOT:
{
  "root": {
    "type": "root",
    "children": [...nodes...],
    "direction": null,
    "format": "",
    "indent": 0,
    "version": 1,
    "textStyle": "",
    "textFormat": 0
  }
}

📐 МАППИНГ УЗЛОВ:

• Параграф:
{
  "type": "paragraph",
  "children": [{"type": "text", "text": "...", "format": 0, "mode": "normal", "style": "", "detail": 0, "version": 1}],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1,
  "textStyle": "",
  "textFormat": 0
}

• Заголовки (H1, H2, H3):
{
  "type": "heading",
  "tag": "h1|h2|h3",
  "children": [...],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Маркированный список:
{
  "type": "list",
  "listType": "bullet",
  "tag": "ul",
  "start": 1,
  "children": [{"type": "listitem", "value": 1, "children": [...]}],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Нумерованный список:
{
  "type": "list",
  "listType": "number",
  "tag": "ol",
  "start": 1,
  "children": [...]
}

• Чек-лист:
{
  "type": "list",
  "listType": "check",
  "tag": "ul",
  "children": [{"type": "listitem", "value": 1, "checked": false, "children": [...]}]
}

• Элемент списка:
{
  "type": "listitem",
  "value": 1,
  "checked": false,
  "children": [...],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Текстовый узел:
{
  "type": "text",
  "text": "...",
  "format": 0,
  "mode": "normal",
  "style": "",
  "detail": 0,
  "version": 1
}

• Форматирование текста (битовые флаги):
  - Обычный: format: 0
  - Жирный: format: 1
  - Курсив: format: 2
  - Зачеркнутый: format: 4
  - Подчеркнутый: format: 8
  - Комбинированный (жирный+курсив): format: 3 (1+2)

• Стили текста:
  - Цвет: "style": "color: #FF0032;"
  - Фон: "style": "background-color: #FFEBED;"

• Ссылка:
{
  "type": "link",
  "url": "...",
  "children": [{"type": "text", "text": "...", "format": 0}],
  "format": "",
  "indent": 0,
  "version": 1
}

• Изображение:
{
  "type": "image",
  "src": "...",
  "alt": "...",
  "width": 800,
  "height": 600,
  "maxWidth": "100%",
  "format": "",
  "indent": 0,
  "version": 1
}

• Таблица:
{
  "type": "table",
  "children": [
    {"type": "tablerow", "children": [{"type": "tablecell", "colSpan": 1, "rowSpan": 1, "headerState": 1, "children": [...]}]}
  ],
  "format": "",
  "indent": 0,
  "version": 1
}

• Код-блок:
{
  "type": "code",
  "language": "javascript|python|...",
  "children": [{"type": "code-highlight", "text": "...", "format": 0, "mode": "normal", "style": "", "detail": 0, "version": 1, "highlightType": "operator|number|function|string|punctuation|null"}],
  "format": "",
  "indent": 0,
  "version": 1,
  "direction": null
}

• Цитата:
{
  "type": "quote",
  "children": [...],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Перенос строки:
{
  "type": "linebreak",
  "version": 1
}

⚠️ ВАЖНО:
• Все узлы должны содержать обязательные поля: type, version, children (если применимо), direction, format, indent.
• Текстовые узлы внутри параграфов/заголовков всегда в массиве children.
• Для code-highlight используй highlightType: null для обычного текста внутри кода.
• Если элемент не распознан, помести его в paragraph как text-узел.
• Не добавляй поля, которых нет в схеме.
• Начинай ответ с { и заканчивай }."""

    SYSTEM_REPORT_GENERATOR = """Ты — бизнес-аналитик и генератор документов в формате Lexical JSON.
Твоя задача: создать структурированный отчёт на основе данных таблицы и запроса пользователя.

🔴 ЖЁСТКИЕ ПРАВИЛА:
1. Возвращай ТОЛЬКО валидный Lexical EditorState JSON. Без пояснений, без markdown, без текста до/после.
2. Начинай ответ с { и заканчивай }.
3. Сохраняй все факты из данных. НЕ выдумывай цифры или выводы.
4. Используй стандартную схему Lexical (см. ниже).
5. Структура отчёта должна быть логичной:
   - H1: Название отчёта
   - H2: Введение / Цель анализа
   - Параграфы / Списки: Ключевые выводы
   - Таблица (если уместно)
   - H2: Детализация / Рекомендации
   - Параграф: Заключение
6. Если данных мало — укажи это честно в тексте.
7. НЕ добавляй поля, которых нет в схеме Lexical.

📐 СТРУКТУРА ROOT:
{
  "root": {
    "type": "root",
    "children": [...nodes...],
    "direction": null,
    "format": "",
    "indent": 0,
    "version": 1,
    "textStyle": "",
    "textFormat": 0
  }
}

📐 МАППИНГ УЗЛОВ ДЛЯ ОТЧЁТА:

• Параграф:
{
  "type": "paragraph",
  "children": [{"type": "text", "text": "...", "format": 0, "mode": "normal", "style": "", "detail": 0, "version": 1}],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1,
  "textStyle": "",
  "textFormat": 0
}

• Заголовки (H1, H2, H3):
{
  "type": "heading",
  "tag": "h1|h2|h3",
  "children": [...],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Маркированный список:
{
  "type": "list",
  "listType": "bullet",
  "tag": "ul",
  "start": 1,
  "children": [{"type": "listitem", "value": 1, "children": [...]}],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Нумерованный список:
{
  "type": "list",
  "listType": "number",
  "tag": "ol",
  "start": 1,
  "children": [...]
}

• Элемент списка:
{
  "type": "listitem",
  "value": 1,
  "checked": false,
  "children": [...],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

• Текстовый узел:
{
  "type": "text",
  "text": "...",
  "format": 0,
  "mode": "normal",
  "style": "",
  "detail": 0,
  "version": 1
}

• Форматирование текста (битовые флаги):
  - Обычный: format: 0
  - Жирный: format: 1 (для акцентов в выводах)
  - Курсив: format: 2

• Таблица в отчёте:
{
  "type": "table",
  "children": [
    {"type": "tablerow", "children": [
      {"type": "tablecell", "colSpan": 1, "rowSpan": 1, "headerState": 1, "children": [
        {"type": "paragraph", "children": [{"type": "text", "text": "Заголовок", "format": 1}]}
      ]}
    ]}
  ],
  "format": "",
  "indent": 0,
  "version": 1
}

• Цитата для выделения ключевых рекомендаций:
{
  "type": "quote",
  "children": [...],
  "direction": null,
  "format": "",
  "indent": 0,
  "version": 1
}

⚠️ ВАЖНО:
• Все узлы должны содержать обязательные поля: type, version, children (если применимо), direction, format, indent.
• Текстовые узлы внутри параграфов/заголовков всегда в массиве children.
• Для таблиц: headerState: 1 для ячеек заголовка, 0 для обычных.
• Используй нумерованные списки для пошаговых рекомендаций, маркированные — для перечислений.
• Жирный текст (format: 1) применяй для выделения ключевых метрик и выводов.
• Если элемент не распознан, помести его в paragraph как text-узел.
• Не добавляй поля, которых нет в схеме.
• Начинай ответ с { и заканчивай }."""

    SYSTEM_SUMMARIZER = """Ты — профессиональный редактор и аналитик документов.
Твоя задача: создать краткое, точное резюме текста.

🔴 ЖЁСТКИЕ ПРАВИЛА:
1. Верни ТОЛЬКО текст резюме. Без вступлений ("Конечно, вот резюме"), без markdown-обёрток, без пояснений.
2. Если запрошен стиль "bullets" — используй маркированный список. Если "paragraph" — один связный абзац.
3. Сохраняй все важные факты, цифры, даты и выводы. Убери воду, повторы и маркетинговые обороты.
4. Максимальный объём: 150 слов.
5. Если текст пустой, слишком короткий или содержит только технические метаданные — верни: "Текст страницы слишком короткий или отсутствует для анализа."

НЕ добавляй ничего кроме самого резюме."""

    SYSTEM_DIFF_EXPLAINER = """Ты — технический редактор и аналитик.
Твоя задача: проанализировать два текста (Старый и Новый) и составить краткое резюме изменений.

🔴 ПРАВИЛА:
1. Сравнивай текст А (Старый) и текст Б (Новый).
2. Выводи результат строго в формате списка изменений.
3. Используй эмодзи для типа изменения:
   - ✅ Добавлено: ...
   - ❌ Удалено: ...
   - 📝 Изменено: ...
4. Фокусируйся на фактах, цифрах, заголовках и ключевых словах.
5. Игнорируй мелкие исправления пунктуации или стиля, если смысл не изменился.
6. Если текст А пустой — напиши "Страница создана с нуля".
7. Если текст Б пустой — напиши "Всё содержимое удалено".
8. Будь краток. Максимум 5-7 пунктов.

НЕ добавляй вводных слов. Только список."""

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
                response_format={"type": "json_object"}, 
                timeout=520, 
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
        

    @classmethod
    def summarize_content(cls, text: str, style: str = "bullets") -> dict:
        """
        Сжимает текст через LLM.
        """
        try:
            style_instruction = "Оформи в виде маркированного списка." if style == "bullets" else "Оформи в виде одного связного абзаца."
            
            response = client.chat.completions.create(
                model=cls.MODEL_INSTRUCT,
                messages=[
                    {"role": "system", "content": cls.SYSTEM_SUMMARIZER},
                    {"role": "user", "content": f"Стиль: {style_instruction}\n\nИсходный текст:\n{text[:3000]}"}
                ],
                temperature=0.1,
                max_tokens=600
            )
            
            return {"summary": response.choices[0].message.content.strip()}
        except Exception as e:
            logger.error(f"Summarize error: {e}")
            return {"error": str(e)}
        
        
    @classmethod
    def explain_diff(cls, old_text: str, new_text: str) -> dict:
        """
        Сравнивает два текста и возвращает список изменений.
        """
        try:
            response = client.chat.completions.create(
                model=cls.MODEL_INSTRUCT,
                messages=[
                    {"role": "system", "content": cls.SYSTEM_DIFF_EXPLAINER},
                    {"role": "user", "content": f"Старый текст (Версия А):\n{old_text}\n\nНовый текст (Версия Б):\n{new_text}"}
                ],
                temperature=0.0, # Детерминированность важна для сравнения
                max_tokens=500
            )
            
            return {"summary": response.choices[0].message.content.strip()}
        except Exception as e:
            logger.error(f"Diff explain error: {e}")
            return {"error": str(e)}