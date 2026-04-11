from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Count, Subquery, OuterRef, Prefetch, Q, Exists
from django.shortcuts import get_object_or_404

from apps.spaces.models import Space, SpaceMembership
from apps.wiki.models import WikiPage, PageMembership
from apps.spaces.serializers import (
    SpaceListSerializer,
    SpaceDetailSerializer,
    SpaceCreateSerializer,
    SpaceUpdateSerializer,
    SpaceMemberListSerializer,
    SpaceMemberActionSerializer, 
    WikiPageCreateSerializer, 
    WikiPageSerializer, 
)
from apps.spaces.permissions import IsSpaceOwnerOrAdmin, IsSpaceMember
from apps.wiki.permissions import IsSpaceOrPageMember


class SpaceViewSet(viewsets.ModelViewSet):
    """
    CRUD для пространств.
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'  # Используем UUID

    def get_queryset(self):
        """
        Оптимизированный QuerySet.
        Возвращаем только те пространства, где пользователь является участником.
        """
        user = self.request.user
        
        # Аннотация роли текущего пользователя
        user_role_subquery = Subquery(
            SpaceMembership.objects.filter(
                space=OuterRef('pk'), 
                user=user
            ).values('role')[:1]
        )

        # 2. Получаем ID пространств, где пользователь состоит в участниках
        # Это заменяет filter(members__user=user) и НЕ ломает COUNT
        allowed_space_ids = SpaceMembership.objects.filter(user=user).values('space_id')

        return (
            Space.objects
            .filter(id__in=allowed_space_ids)
            .annotate(
                user_role=user_role_subquery,
                # Coalesce защищает от None, если в пространстве 0 участников/страниц
                members_count=Count('members', distinct=True),
                pages_count=Count('pages', distinct=True)
            )
            .select_related('owner')
            .prefetch_related(
                Prefetch('members', queryset=SpaceMembership.objects.select_related('user')),
                'pages'
            )
            .distinct()
            .order_by('-created_at')
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SpaceListSerializer
        elif self.action == 'create':
            return SpaceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SpaceUpdateSerializer
        return SpaceDetailSerializer

    def perform_create(self, serializer):
        # Сериализатор сам проставит owner=self.request.user
        serializer.save()

    def perform_update(self, serializer):
        # Явная проверка прав перед сохранением (PATCH/PUT)
        if not IsSpaceOwnerOrAdmin().has_object_permission(self.request, self, serializer.instance):
            self.permission_denied(
                self.request, 
                message="Только владелец или администратор может изменять название и описание пространства."
            )
        serializer.save()

    def perform_destroy(self, instance):
        # Проверка прав на удаление (только Owner)
        if not IsSpaceOwnerOrAdmin().has_object_permission(self.request, self, instance):
            self.permission_denied(self.request, message="Только владелец может удалить пространство.")

        instance.delete()


class SpaceMembershipViewSet(viewsets.ModelViewSet):
    """
    Управление участниками пространства.
    """
    lookup_field = 'user'  # Ищем запись участия по UUID пользователя
    lookup_url_kwarg = 'user' # Параметр в URL: /members/<uuid:user>/

    def get_permissions(self):
        """
        Динамические права:
        - list/retrieve: любой участник пространства
        - create/update/delete: только admin/owner
        """
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated(), IsSpaceMember()]
        return [IsAuthenticated(), IsSpaceOwnerOrAdmin()]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return SpaceMemberListSerializer
        return SpaceMemberActionSerializer

    def get_queryset(self):
        space_id = self.kwargs.get('space_id')
        # Проверяем существование пространства
        get_object_or_404(Space, id=space_id)
        
        # Оптимизация: prefetch для избежания N+1 при чтении списка
        return SpaceMembership.objects.filter(
            space_id=space_id
        ).select_related('user', 'space')

    def get_object(self):
        """
        Переопределяем получение объекта для работы с lookup_field='user' (UUID)
        """
        space_id = self.kwargs.get('space_id')
        user_id = self.kwargs.get(self.lookup_url_kwarg)
        return get_object_or_404(
            SpaceMembership, 
            space_id=space_id, 
            user_id=user_id
        )

    def perform_create(self, serializer):
        space_id = self.kwargs.get('space_id')
        space = get_object_or_404(Space, id=space_id)
        # Сохраняем связь с пространством
        serializer.save(space=space)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        space_id = self.kwargs.get('space_id')
        # Передаем объект пространства в контекст сериализатора для валидации
        context['space'] = get_object_or_404(Space, id=space_id)
        return context

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Нельзя удалить владельца
        if instance.role == 'owner':
            return Response(
                {"detail": "Невозможно удалить владельца пространства."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class WikiPageView(APIView):
    """
    Управление страницами пространства:
    GET  -> рекурсивное дерево страниц
    POST -> создание новой страницы
    """
    permission_classes = [IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, space_id):
        space = get_object_or_404(Space, id=space_id)
        
        # Оптимизированный плоский запрос
        pages = (
            WikiPage.objects.filter(space=space)
            .select_related('created_by', 'updated_by', 'parent')
            .order_by('order', '-updated_at')
        )
        
        # Сериализуем в плоский список
        flat_data = WikiPageSerializer(pages, many=True).data
        
        # Превращаем плоский список в рекурсивное дерево
        tree = self._build_page_tree(flat_data)
        return Response(tree)

    def post(self, request, space_id):
        space = get_object_or_404(Space, id=space_id)
        
        serializer = WikiPageCreateSerializer(
            data=request.data,
            context={'request': request, 'space': space}
        )
        serializer.is_valid(raise_exception=True)
        page = serializer.save()

        # Создатель автоматически становится owner страницы
        PageMembership.objects.get_or_create(
            page=page,
            user=request.user,
            defaults={'role': 'owner', 'granted_by': request.user}
        )

        return Response(WikiPageSerializer(page).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _build_page_tree(flat_list: list) -> list:
        """
        Преобразует плоский список страниц в вложенную древовидную структуру.
        Работает за O(N), не требует рекурсивных SQL-запросов.
        """
        # Карта страниц для быстрого доступа по ID
        page_map = {item['id']: {**item, 'children': []} for item in flat_list}
        root_nodes = []

        for item in flat_list:
            parent_id = item.get('parent')
            if parent_id and parent_id in page_map:
                # Добавляем текущего ребенка в массив children родителя
                page_map[parent_id]['children'].append(page_map[item['id']])
            else:
                # Если родителя нет или он null → это корневая страница
                root_nodes.append(page_map[item['id']])

        return root_nodes