from django.contrib import admin

from apps.spaces.models import SpaceMembership, Space


class SpaceMembershipInline(admin.TabularInline):
    model = SpaceMembership
    raw_id_fields = ('user',)
    extra = 0
    verbose_name = "Участник"
    verbose_name_plural = "Участники пространства"

@admin.register(Space)
class SpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at', 'updated_at')
    list_filter = ('owner', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('owner',)
    inlines = [SpaceMembershipInline]
    list_select_related = ('owner',)

@admin.register(SpaceMembership)
class SpaceMembershipAdmin(admin.ModelAdmin):
    list_display = ('space', 'user', 'role', 'created_at')
    list_filter = ('role', 'space')
    search_fields = ('space__name', 'user__email')
    raw_id_fields = ('space', 'user')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('space', 'user')

