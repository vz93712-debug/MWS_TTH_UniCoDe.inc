from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.wiki.models import WikiPage, WikiPageVersion
from apps.wiki.serializers.serializers_page import (
    WikiPageDetailSerializer, 
    WikiPageUpdateSerializer,
    WikiPageMoveSerializer
)
from apps.wiki.permissions import IsSpaceOrPageMember
from apps.spaces.models import Space, SpaceMembership


class WikiPageDetailView(APIView):
    """
    DETAIL CRUD для страницы: GET (чтение), PATCH (сохранение/версия), DELETE (удаление).
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        self.check_object_permissions(request, page)
        
        serializer = WikiPageDetailSerializer(page, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        self.check_object_permissions(request, page)

        serializer = WikiPageUpdateSerializer(
            page, 
            data=request.data, 
            partial=True, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        updated_page = serializer.save()

        return Response(WikiPageDetailSerializer(updated_page, context={'request': request}).data)

    def delete(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        self.check_object_permissions(request, page)
        
        page.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WikiPageMoveView(APIView):
    """
    Перемещение страницы в другое пространство или под другую страницу.
    Поддерживает кросс-пространственную иерархию: родитель определяет пространство.
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def patch(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        self.check_object_permissions(request, page)  # Проверка прав на ИСХОДНУЮ страницу

        move_serializer = WikiPageMoveSerializer(data=request.data, context={'page_id': page_id})
        move_serializer.is_valid(raise_exception=True)
        data = move_serializer.validated_data

        target_parent = None
        target_space = None

        with transaction.atomic():
            if data.get('new_parent_id'):
                target_parent = get_object_or_404(WikiPage, id=data['new_parent_id'])
                target_space = target_parent.space

                if data.get('new_space_id') and data['new_space_id'] != target_space.id:
                    return Response(
                        {"detail": "Целевое пространство не совпадает с пространством родительской страницы."}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if self._is_ancestor(target_parent, page.id):
                    return Response(
                        {"detail": "Нельзя переместить страницу в одного из её потомков (циклическая ссылка)." }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            elif data.get('new_space_id'):
                target_space = get_object_or_404(Space, id=data['new_space_id'])
                target_parent = None  # Перемещение в корень пространства
            else:
                return Response({"detail": "Некорректные параметры перемещения."}, status=status.HTTP_400_BAD_REQUEST)

            has_target_access = SpaceMembership.objects.filter(
                space=target_space, 
                user=request.user, 
                role__in=['owner', 'admin', 'user']
            ).exists()
            
            if not has_target_access:
                return Response(
                    {"detail": "Нет доступа к целевому пространству или странице."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            page.space = target_space
            page.parent = target_parent
            page.save(update_fields=['space', 'parent', 'updated_at'])

        return Response(WikiPageDetailSerializer(page, context={'request': request}).data)

    @staticmethod
    def _is_ancestor(potential_parent, page_id):
        """
        Поднимается вверх по иерархии от potential_parent.
        Если встречает page_id -> значит page уже является предком, и вложение создаст цикл.
        """
        current = potential_parent
        while current:
            if current.id == page_id:
                return True
            current = current.parent
        return False