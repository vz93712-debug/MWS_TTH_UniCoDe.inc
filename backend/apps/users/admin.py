from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db import models

from apps.users.models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff', 'created_at')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'groups', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'last_login', 'created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Личные данные', {'fields': ('id', 'first_name', 'last_name', 'phone_number', 'mws_api_token')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Даты', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'phone_number', 'mws_api_token', 'password1', 'password2'),
        }),
    )

