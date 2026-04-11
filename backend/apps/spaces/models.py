from django.db import models
from apps.core.models import BaseModel
from apps.users.models import User

class Space(BaseModel):
    """
    Пространство.
    """
    name = models.CharField(max_length=255, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_spaces', verbose_name="Владелец")

    class Meta:
        db_table = 'spaces'

    def __str__(self):
        return self.name

class SpaceMembership(BaseModel):
    """
    Участие пользователя в пространстве.
    """
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('user', 'User'),
    ]

    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='members', verbose_name="Пространство")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Пользователь")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user', verbose_name="Роль")

    class Meta:
        db_table = 'space_memberships'
        unique_together = ['space', 'user']  
        indexes = [models.Index(fields=['user', 'role'])]

    def __str__(self):
        return f"{self.user.email} - {self.role} in {self.space.name}"