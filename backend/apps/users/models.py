from django.db import models 
from django.contrib.auth.models import AbstractUser

from apps.users.managers import CustomUserManager
from apps.core.models import BaseModel

class User(AbstractUser, BaseModel):
    """
    Кастомная модель пользователя.
    Наследует базовые поля auth-системы Django, добавляет специфичные для MWS.
    """
    email = models.EmailField(verbose_name='E-mail', unique=True)
    first_name = models.CharField(max_length=150, verbose_name="Имя")
    last_name = models.CharField(max_length=150, verbose_name="Фамилия")
    
    phone_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="Номер телефона", 
        unique=True, 
    )
    
    mws_api_token = models.CharField(
        max_length=500, 
        verbose_name="Токен MWS API"
    )

    # Авторизация по username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['mws_api_token', 'first_name', 'last_name', 'username']

    objects = CustomUserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username