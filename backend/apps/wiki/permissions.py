# apps/wiki/permissions.py
from rest_framework import permissions
from apps.spaces.models import SpaceMembership
from apps.wiki.models import PageMembership, WikiPage

class IsSpaceOrPageMember(permissions.BasePermission):
    """
    Двухуровневая проверка прав:
    1. Сначала проверяем явные права на страницу (PageMembership)
    2. Если нет — наследуем права от пространства (SpaceMembership)
    
    Работает как для URL со space_id, так и с page_id.
    Совместима с APIView и ViewSet.
    """
    
    ROLE_HIERARCHY = {'owner': 3, 'admin': 2, 'user': 1}
    
    # Маппинг HTTP-методов на "действия" для APIView
    METHOD_TO_ACTION = {
        'GET': 'retrieve',
        'POST': 'create',
        'PUT': 'update',
        'PATCH': 'partial_update',
        'DELETE': 'destroy',
        'OPTIONS': 'options',
        'HEAD': 'head',
    }
    
    def _get_action(self, view, request):
        """
        Получает действие: из view.action (если ViewSet) или из метода запроса (если APIView).
        """
        # Если это ViewSet — используем стандартный action
        if hasattr(view, 'action') and view.action:
            return view.action
        # Если это APIView — маппим метод на действие
        return self.METHOD_TO_ACTION.get(request.method, request.method.lower())
    
    def has_permission(self, request, view):
        """Проверка на уровне пространства (для list/create) или страницы (для detail)."""
        if not request.user.is_authenticated:
            return False
        
        action = self._get_action(view, request)
        
        # Случай 1: В URL есть space_id (список/создание страниц)
        space_id = view.kwargs.get('space_id')
        if space_id:
            return self._user_has_space_access(request.user, space_id, action)
        
        # Случай 2: В URL есть page_id (детальная страница)
        page_id = view.kwargs.get('page_id')
        if page_id:
            return self._user_has_page_access(request.user, page_id, action)
        
        # Случай 3: Нет ни space_id, ни page_id (например, профиль)
        return True
    
    def has_object_permission(self, request, view, obj):
        """Проверка на уровне конкретного объекта (для update/delete)."""
        action = self._get_action(view, request)
        
        # Для WikiPage используем ту же логику
        if isinstance(obj, WikiPage):
            return self._user_has_page_access(request.user, obj.id, action)
        return True
    
    def _user_has_page_access(self, user, page_id, action):
        """Проверка прав пользователя на конкретную страницу."""
        try:
            # 1. Проверяем явные права на страницу
            page_membership = PageMembership.objects.get(page_id=page_id, user=user)
            return self._role_has_action_access(page_membership.role, action)
        except PageMembership.DoesNotExist:
            pass
        
        # 2. Наследуем от пространства (нужно загрузить страницу, чтобы получить space_id)
        try:
            page = WikiPage.objects.select_related('space').get(id=page_id)
            return self._user_has_space_access(user, page.space_id, action)
        except WikiPage.DoesNotExist:
            return False
    
    def _user_has_space_access(self, user, space_id, action):
        """Проверка прав пользователя в пространстве."""
        try:
            membership = SpaceMembership.objects.get(space_id=space_id, user=user)
            return self._role_has_action_access(membership.role, action)
        except SpaceMembership.DoesNotExist:
            return False
    
    def _role_has_action_access(self, role, action):
        """Определяет, разрешено ли действие для данной роли."""
        # Действия, доступные всем участникам (включая 'user')
        read_actions = ['list', 'retrieve', 'create', 'options', 'head']
        # Действия, доступные только admin/owner
        write_actions = ['update', 'partial_update', 'destroy', 'move']
        
        if role == 'owner':
            return True
        elif role == 'admin':
            return action in read_actions + write_actions
        elif role == 'user':
            return action in read_actions
        return False