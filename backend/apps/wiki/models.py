from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User
from apps.spaces.models import Space

class WikiPage(BaseModel):
    """
    Страница вики.
    """
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='pages', verbose_name="Пространство")
    title = models.CharField(max_length=500, verbose_name="Заголовок")
    description = models.TextField(blank=True, verbose_name="Краткое описание")
    
    # Контент
    content = models.JSONField(default=dict, verbose_name="Содержимое (Lexical JSON)")
    yjs_state = models.BinaryField(null=True, blank=True, verbose_name="Состояние Yjs (Binary)")
    
    # Иерархия
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children', verbose_name="Родительская страница")
    order = models.FloatField(default=0, db_index=True) 
    
    # Авторство
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_pages', verbose_name="Создатель")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_pages', verbose_name="Редактор", db_index=True)
    
    # Версионирование
    current_version = models.IntegerField(default=1, verbose_name="Текущая версия")

    class Meta:
        db_table = 'wiki_pages'
        unique_together = ['space', 'id']
        indexes = [
            models.Index(fields=['space', '-updated_at']),
            models.Index(fields=['id']),
        ]

    def __str__(self):
        return f'{self.space.name} {self.title}'


class WikiPageVersion(BaseModel):
    """
    Снапшот контента страницы для отката.
    """
    page = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='versions', verbose_name="Страница")
    version_number = models.IntegerField(verbose_name="Номер версии")
    content = models.JSONField(verbose_name="Содержимое (Снапшот)")
    comment = models.CharField(max_length=500, blank=True, verbose_name="Комментарий к версии")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="Автор")

    class Meta:
        db_table = 'wiki_versions'
        unique_together = ['page', 'version_number']
        ordering = ['-version_number']


class PageMembership(BaseModel):
    """
    Права доступа к конкретной странице (переопределяют права пространства).
    """
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('user', 'User'),
    ]
    page = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='members', verbose_name="Страница")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user', verbose_name="Роль")
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='granted_permissions', verbose_name="Кто выдал")

    class Meta:
        db_table = 'page_memberships'
        unique_together = ['page', 'user']


class LinkedEntity(BaseModel):
    """
    Материализованный индекс связанных сущностей MWS.
    """
    ENTITY_TYPES = [
        ('datasheet', 'Таблица'), 
        ('view', 'Представление'), 
        ('record', 'Запись'), 
        ('page', 'Страница')
    ]
    page = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='linked_entities', verbose_name="Страница")
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES, verbose_name="Тип сущности")
    mws_id = models.CharField(max_length=50, db_index=True, verbose_name="ID в MWS")
    render_config = models.JSONField(default=dict, verbose_name="Настройки отображения")

    class Meta:
        db_table = 'linked_entities'
        unique_together = ['page', 'entity_type', 'mws_id']
        indexes = [models.Index(fields=['entity_type', 'mws_id'])]


class PageLink(BaseModel):
    """
    Связи между страницами (для Backlinks и Графа).
    """
    source = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='outgoing_links', verbose_name="Откуда")
    target = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='incoming_links', verbose_name="Куда")

    class Meta:
        db_table = 'page_links'
        unique_together = ['source', 'target']
        indexes = [models.Index(fields=['target', 'source'])]


class Comment(BaseModel):
    """
    Комментарии к странице или блокам контента.
    """
    page = models.ForeignKey(WikiPage, on_delete=models.CASCADE, related_name='comments', verbose_name="Страница")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    mark_id = models.CharField(max_length=255, null=True, blank=True, verbose_name="ID mark-ноды из Lexical JSON")
    content = models.TextField(verbose_name="Текст комментария")
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies', verbose_name="Родительский комментарий")

    class Meta:
        db_table = 'comments'


class UserSyncState(BaseModel):
    """
    Трекинг состояния пользователя для Yjs и оффлайн-режима.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    page = models.ForeignKey(WikiPage, on_delete=models.CASCADE, verbose_name="Страница")
    client_yjs_version = models.IntegerField(default=0, verbose_name="Версия Yjs на клиенте")
    is_offline = models.BooleanField(default=False, verbose_name="Потеряно соединение")
    last_activity = models.DateTimeField(auto_now=True, verbose_name="Последняя активность")

    class Meta:
        db_table = 'user_sync_state'
        unique_together = ['user', 'page']
