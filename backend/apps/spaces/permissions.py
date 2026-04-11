from rest_framework import permissions

from apps.spaces.models import SpaceMembership


class IsSpaceMember(permissions.BasePermission):
    """
    Разрешает доступ любому участнику пространства.
    """
    def has_object_permission(self, request, view, obj):
        # obj — это SpaceMembership (участник)
        try:
            # Проверяем, что текущий пользователь — участник того же пространства
            return SpaceMembership.objects.filter(
                space=obj.space, 
                user=request.user
            ).exists()
        except:
            return False


class IsSpaceOwnerOrAdmin(permissions.BasePermission):
    """
    Разрешает доступ только Owner или Admin пространства.
    """
    def has_object_permission(self, request, view, obj):
        # Если это само пространство
        if hasattr(obj, 'owner'):
            try:
                membership = obj.members.get(user=request.user)
                return membership.role in ['owner', 'admin']
            except SpaceMembership.DoesNotExist:
                return False
        
        # Если это запись участника (SpaceMembership)
        if hasattr(obj, 'space'):
            try:
                # Проверяем права текущего пользователя в ПРОСТРАНСТВЕ этого участника
                my_membership = obj.space.members.get(user=request.user)
                return my_membership.role in ['owner', 'admin']
            except SpaceMembership.DoesNotExist:
                return False
        
        return False