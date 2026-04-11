from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.wiki.models import WikiPage, PageMembership, WikiPageVersion, LinkedEntity, PageLink
# from .tasks import parse_page_content_task # Импортируем таск Celery

@receiver(post_save, sender=WikiPage)
def create_page_membership_and_trigger_parsing(sender, instance, created, **kwargs):
    """
    1. Назначаем права Owner создателю страницы.
    2. Запускаем фоновый парсинг контента (для LinkedEntity и Graph).
    """
    
    # 1. Права
    if created and instance.created_by:
        PageMembership.objects.get_or_create(
            page=instance,
            user=instance.created_by,
            defaults={'role': 'owner'}
        )

    # 2. Парсинг контента (Связи и Таблицы)
    # Делаем это только при изменении контента, а не любого поля (например updated_at)
    # Для хакатона можно вызывать всегда при save, Celery сам разберется
    if hasattr(instance, '_content_updated'): # Флаг, который мы ставим в serializer/view
        # celery_task_parse_content.delay(instance.id)
        pass 


@receiver(post_save, sender=WikiPageVersion)
def delete_old_versions(sender, instance, **kwargs):
    """
    После создания новой версии удаляем самые старые, оставляя только 20 последних.
    """
    max_versions = 20
    
    # Находим ID версий, которые нужно удалить
    # Сортируем по номеру версии от новых к старым, берем все, что после 20-й
    old_versions = WikiPageVersion.objects.filter(
        page=instance.page
    ).order_by('-version_number')[max_versions:]
    
    # Удаляем
    if old_versions.exists():
        old_versions.delete()