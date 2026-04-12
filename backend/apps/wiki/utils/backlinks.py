# apps/wiki/utils.py
import re
import json
from django.db import transaction
from apps.wiki.models import WikiPage, PageLink

# Case-insensitive паттерн для UUID
UUID_PATTERN = re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', re.IGNORECASE)

def sync_page_links(page: WikiPage):
    print(f"🚀 [sync_page_links] START для страницы {page.id}")
    
    content = page.content
    if not content or not isinstance(content, dict):
        print(f"⚠️ [sync_page_links] ABORT: контент пустой или не dict.")
        return

    # 🔥 FIX: Lexical JSON всегда обёрнут в {"root": {...}}
    root_node = content.get('root', content)
    
    print("📜 [SYNC DEBUG] Начало контента (первые 600 символов):")
    print(json.dumps(content, ensure_ascii=False)[:600])
    print("📜 [SYNC DEBUG] Конец дампа.")

    found_ids = set()
    visited_nodes = 0

    def extract_uuids_from_text(text: str):
        if text:
            matches = UUID_PATTERN.findall(text)
            if matches:
                print(f"   🔍 [TEXT] Нашел UUID в тексте: {matches}")
                found_ids.update(m.lower() for m in matches)

    def traverse(node, depth=0):
        nonlocal visited_nodes
        visited_nodes += 1
        indent = "  " * depth

        if isinstance(node, dict):
            node_type = node.get('type', 'UNKNOWN_TYPE')
            keys = list(node.keys())
            
            if depth < 2:
                print(f"{indent} [NODE] type='{node_type}', keys={keys}")

            # 1. Кастомный узел page-ref
            if node_type == 'page-ref':
                pid = node.get('dataset', {}).get('pageId')
                if pid:
                    print(f"{indent}📌 [page-ref] Нашел pageId: {pid}")
                    found_ids.add(str(pid).lower())

            # 2. Стандартная гиперссылка
            elif node_type == 'link':
                url = node.get('url', '')
                if isinstance(url, str):
                    match = UUID_PATTERN.search(url)
                    if match:
                        print(f"{indent}🔗 [link] Нашел UUID в URL: {match.group(0)}")
                        found_ids.add(match.group(0).lower())

            # 3. Текстовые узлы
            elif node_type == 'text':
                text_val = node.get('text', '')
                if text_val and UUID_PATTERN.search(text_val):
                    print(f"{indent}📝 [text] Сканирую текст: '{text_val[:50]}...'")
                    extract_uuids_from_text(text_val)

            # Рекурсия по children
            children = node.get('children', [])
            if children:
                for child in children:
                    traverse(child, depth + 1)

        elif isinstance(node, list):
            for item in node:
                traverse(item, depth)

    print(f"🔄 [sync_page_links] Запускаю обход JSON...")
    traverse(root_node)  # 🔥 ПЕРЕДАЁМ ИМЕННО ROOT_NODE
    
    print(f"✅ [sync_page_links] Обход завершён. Посещено узлов: {visited_nodes}. Найдено UUID: {found_ids}")

    if not found_ids:
        print(f"⛔ [sync_page_links] Выход: UUID не найдены.")
        return

    print(f"🗄️ [sync_page_links] Проверяю существование страниц в БД...")
    valid_ids = set(
        WikiPage.objects.filter(id__in=found_ids).values_list('id', flat=True)
    )
    print(f"✅ [sync_page_links] Валидные ID в БД: {valid_ids}")

    with transaction.atomic():
        current_targets = set(
            PageLink.objects.filter(source=page).values_list('target_id', flat=True)
        )
        to_create = valid_ids - current_targets
        to_delete = current_targets - valid_ids
        
        print(f"➕ Создать: {to_create}")
        print(f"➖ Удалить: {to_delete}")

        if to_create:
            PageLink.objects.bulk_create([
                PageLink(source=page, target_id=tgt) for tgt in to_create
            ])
            print(f"🛠️ [sync_page_links] Создано {len(to_create)} связей.")
        if to_delete:
            PageLink.objects.filter(source=page, target_id__in=to_delete).delete()
            print(f"🗑️ [sync_page_links] Удалено {len(to_delete)} связей.")