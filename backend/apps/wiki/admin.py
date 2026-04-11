from django.contrib import admin

from .models import (
    WikiPage, WikiPageVersion, PageMembership,
    LinkedEntity, PageLink, Comment, UserSyncState
)


class WikiPageVersionInline(admin.TabularInline):
    model = WikiPageVersion
    fields = ('version_number', 'created_by', 'comment', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    extra = 0
    can_delete = False
    ordering = ('-version_number',)
    verbose_name = "Версия"
    verbose_name_plural = "История версий"

class CommentInline(admin.StackedInline):
    model = Comment
    fields = ('user', 'content', 'mark_id', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
    extra = 0
    verbose_name = "Комментарий"
    verbose_name_plural = "Комментарии"

class PageMembershipInline(admin.TabularInline):
    model = PageMembership
    raw_id_fields = ('user', 'granted_by')
    extra = 1
    verbose_name = "Доступ к странице"

class LinkedEntityInline(admin.TabularInline):
    model = LinkedEntity
    fields = ('entity_type', 'mws_id', 'render_config')
    readonly_fields = ('created_at', 'updated_at')
    extra = 0
    verbose_name = "Связанная сущность MWS"

@admin.register(WikiPage)
class WikiPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'space', 'created_by', 'updated_by', 'current_version', 'updated_at')
    list_filter = ('space', 'updated_by', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at', 'current_version', 'id', 'yjs_state')
    raw_id_fields = ('space', 'parent', 'created_by', 'updated_by')
    inlines = [WikiPageVersionInline, CommentInline, PageMembershipInline, LinkedEntityInline]
    date_hierarchy = 'updated_at'
    list_select_related = ('space', 'created_by', 'updated_by')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "parent":
            # Ограничиваем выбор родителя страницами того же пространства
            if request.resolver_match.kwargs.get('object_id'):
                current_space = WikiPage.objects.get(id=request.resolver_match.kwargs['object_id']).space_id
                kwargs["queryset"] = WikiPage.objects.filter(space_id=current_space)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    @admin.display(description="Содержимое (JSON)")
    def content_preview(self, obj):
        if obj.content:
            return f"JSON (len: {len(str(obj.content))})"
        return "— Пусто —"

@admin.register(WikiPageVersion)
class WikiPageVersionAdmin(admin.ModelAdmin):
    list_display = ('page', 'version_number', 'created_by', 'comment', 'created_at')
    list_filter = ('created_by', 'created_at')
    search_fields = ('page__title', 'comment')
    raw_id_fields = ('page', 'created_by')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_select_related = ('page', 'created_by')

@admin.register(PageMembership)
class PageMembershipAdmin(admin.ModelAdmin):
    list_display = ('page', 'user', 'role', 'granted_by', 'created_at')
    list_filter = ('role', 'granted_by')
    search_fields = ('page__title', 'user__email')
    raw_id_fields = ('page', 'user', 'granted_by')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('page', 'user', 'granted_by')

@admin.register(LinkedEntity)
class LinkedEntityAdmin(admin.ModelAdmin):
    list_display = ('page', 'entity_type', 'mws_id', 'created_at')
    list_filter = ('entity_type',)
    search_fields = ('page__title', 'mws_id')
    raw_id_fields = ('page',)
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('page',)

@admin.register(PageLink)
class PageLinkAdmin(admin.ModelAdmin):
    list_display = ('source', 'target', 'created_at')
    search_fields = ('source__title', 'target__title')
    raw_id_fields = ('source', 'target')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('source', 'target')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('page', 'user', 'content_short', 'parent', 'created_at')
    list_filter = ('user', 'created_at')
    search_fields = ('content', 'user__email', 'page__title')
    raw_id_fields = ('page', 'user', 'parent')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('page', 'user', 'parent')

    @admin.display(description="Текст", ordering='content')
    def content_short(self, obj):
        if obj.content:
            return obj.content[:120] + ("…" if len(obj.content) > 120 else "")
        return "—"

@admin.register(UserSyncState)
class UserSyncStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'page', 'client_yjs_version', 'is_offline', 'last_activity')
    list_filter = ('is_offline', 'last_activity')
    search_fields = ('user__email', 'page__title')
    raw_id_fields = ('user', 'page')
    readonly_fields = ('last_activity', 'created_at', 'updated_at')
    list_select_related = ('user', 'page')
    actions = ['mark_online']

    @admin.action(description="Отметить как онлайн")
    def mark_online(self, request, queryset):
        updated = queryset.update(is_offline=False)
        self.message_user(request, f"Обновлено записей: {updated}")
