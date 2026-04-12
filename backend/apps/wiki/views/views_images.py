import os
import uuid
from django.core.files.storage import default_storage
from django.http import JsonResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser

@api_view(['POST'])
@parser_classes([MultiPartParser])  # Указываем DRF, что ждем multipart/form-data
def upload_media(request):
    # Проверяем, пришел ли файл по ключу 'file' из контракта
    if 'file' not in request.FILES:
        return JsonResponse({
            "success": False, 
            "error": "Файл не найден в запросе"
        }, status=400)

    file_obj = request.FILES['file']
    original_filename = file_obj.name

    # 1. Защита от дубликатов имен
    # Вытаскиваем расширение (например, .png)
    ext = os.path.splitext(original_filename)[1]
    # Генерируем уникальное имя: a1b2c3d4e5f6... + .png
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    
    # Путь сохранения внутри папки media (media/uploads/...)
    save_path = f"uploads/{unique_filename}"

    # 2. Сохраняем файл через default_storage
    # Это позволит легко переключиться на S3 в будущем
    saved_path = default_storage.save(save_path, file_obj)
    
    # 3. Получаем URL файла
    file_url = default_storage.url(saved_path)
    
    # Формируем абсолютный URL (с https://твой-домен.ru/...)
    absolute_url = request.build_absolute_uri(file_url)

    # 4. Возвращаем ответ строго по контракту
    return JsonResponse({
        "success": True,
        "url": absolute_url,
        "filename": original_filename  # Возвращаем оригинальное имя для alt-текста
    })