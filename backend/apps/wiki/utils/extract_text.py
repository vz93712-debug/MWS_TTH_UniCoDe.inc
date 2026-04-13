# apps/wiki/utils.py
import json
import re

def extract_text_from_lexical(content: dict) -> str:
    """
    Извлекает весь читаемый текст из Lexical EditorState JSON.
    Игнорирует системные поля, оставляет только текстовые узлы.
    """
    text_parts = []
    
    def traverse(node):
        if isinstance(node, dict):
            if node.get("type") == "text":
                text_parts.append(node.get("text", ""))
            # Рекурсия по детям
            for child in node.get("children", []):
                traverse(child)
        elif isinstance(node, list):
            for item in node:
                traverse(item)

    # Lexical всегда хранит контент внутри объекта "root"
    root_node = content.get("root", content)
    traverse(root_node)
    
    # Склеиваем и чистим лишние пробелы
    raw_text = " ".join(text_parts).strip()
    # Убираем множественные переносы строк и табуляции
    return re.sub(r'\s+', ' ', raw_text)