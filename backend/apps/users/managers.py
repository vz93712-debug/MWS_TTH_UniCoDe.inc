from django.contrib.auth.models import BaseUserManager
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class CustomUserManager(BaseUserManager):
    """
    Кастомный менеджер для создания пользователей.
    """
    def email_validator(self, email):
        try:
            validate_email(email)
        except ValidationError:
            raise ValueError('You must provide a valid email address')

    def create_user(self, email, username, password=None, mws_api_token=None, **extra_fields):
        if email:
            email = self.normalize_email(email)
            self.email_validator(email)
        else:
            raise ValueError('Поле email обязательно')

        if not username:
            raise ValueError('Поле username обязательно')
        if not mws_api_token:
            raise ValueError('Токен MWS API обязателен')
        
        user = self.model(email=email, username=username, mws_api_token=mws_api_token, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, mws_api_token=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        return self.create_user(email, username, password, mws_api_token, **extra_fields)
