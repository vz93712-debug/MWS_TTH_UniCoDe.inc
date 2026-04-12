# apps/wiki/utils.py
import re
import json
from django.db import transaction
from apps.wiki.models import WikiPage, PageLink

# Case-insensitive паттерн для UUID
UUID_PATTERN = re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', re.IGNORECASE)

def sync_page_links(page: WikiPage):
    
    content = page.content
    if not content or not isinstance(content, dict):
        return

    # 🔥 FIX: Lexical JSON всегда обёрнут в {"root": {...}}
    root_node = content.get('root', content)
    
    found_ids = set()
    visited_nodes = 0

    def extract_uuids_from_text(text: str):
        if text:
            matches = UUID_PATTERN.findall(text)
            if matches:
                found_ids.update(m.lower() for m in matches)

    def traverse(node, depth=0):
        nonlocal visited_nodes
        visited_nodes += 1
        indent = "  " * depth

        if isinstance(node, dict):
            node_type = node.get('type', 'UNKNOWN_TYPE')
            keys = list(node.keys())
            
            # 1. Кастомный узел page-ref
            if node_type == 'page-ref':
                pid = node.get('dataset', {}).get('pageId')
                if pid:
                    found_ids.add(str(pid).lower())

            # 2. Стандартная гиперссылка
            elif node_type == 'link':
                url = node.get('url', '')
                if isinstance(url, str):
                    match = UUID_PATTERN.search(url)
                    if match:
                        found_ids.add(match.group(0).lower())

            # 3. Текстовые узлы
            elif node_type == 'text':
                text_val = node.get('text', '')
                if text_val and UUID_PATTERN.search(text_val):
                    extract_uuids_from_text(text_val)

            # Рекурсия по children
            children = node.get('children', [])
            if children:
                for child in children:
                    traverse(child, depth + 1)

        elif isinstance(node, list):
            for item in node:
                traverse(item, depth)

    traverse(root_node)  # 🔥 ПЕРЕДАЁМ ИМЕННО ROOT_NODE
    

    if not found_ids:
        return

    valid_ids = set(
        WikiPage.objects.filter(id__in=found_ids).values_list('id', flat=True)
    )

    with transaction.atomic():
        current_targets = set(
            PageLink.objects.filter(source=page).values_list('target_id', flat=True)
        )
        to_create = valid_ids - current_targets
        to_delete = current_targets - valid_ids
        
        if to_create:
            PageLink.objects.bulk_create([
                PageLink(source=page, target_id=tgt) for tgt in to_create
            ])
        if to_delete:
            PageLink.objects.filter(source=page, target_id__in=to_delete).delete()
