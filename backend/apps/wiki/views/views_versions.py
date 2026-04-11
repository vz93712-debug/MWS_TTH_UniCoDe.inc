from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.wiki.models import WikiPage, WikiPageVersion
from apps.wiki.serializers.serializers_versions import VersionListSerializer, VersionDetailSerializer
from apps.wiki.permissions import IsSpaceOrPageMember
from apps.spaces.models import SpaceMembership
from apps.wiki.models import PageMembership


class VersionListView(APIView):
    """
    GET /pages/{page_id}/versions/
    Возвращает историю версий страницы от новых к старым.
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        self.check_object_permissions(request, page)

        versions = (
            WikiPageVersion.objects
            .filter(page=page)
            .select_related('created_by')
            .order_by('-version_number')
        )
        serializer = VersionListSerializer(versions, many=True)
        return Response(serializer.data)


class VersionDetailView(APIView):
    """
    GET /pages/{page_id}/versions/{version_id}/
    Возвращает полный контент конкретной версии для сравнения (diff).
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id, version_id):
        page = get_object_or_404(WikiPage, id=page_id)
        self.check_object_permissions(request, page)

        version = get_object_or_404(WikiPageVersion, id=version_id, page=page)
        serializer = VersionDetailSerializer(version)
        return Response(serializer.data)


class VersionRestoreView(APIView):
    """
    POST /pages/{page_id}/versions/{version_id}/restore/
    Откат к выбранной версии. Создаёт новую запись в истории, обновляет текущий контент.
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def post(self, request, page_id, version_id):
        page = get_object_or_404(WikiPage, id=page_id)
        version = get_object_or_404(WikiPageVersion, id=version_id, page=page)
        
        self.check_object_permissions(request, page)

        # 🔒 Явная проверка прав на редактирование/откат
        has_edit_access = False
        try:
            perm = PageMembership.objects.get(page=page, user=request.user)
            has_edit_access = perm.role in ['owner', 'admin']
        except PageMembership.DoesNotExist:
            try:
                space_perm = SpaceMembership.objects.get(space=page.space, user=request.user)
                has_edit_access = space_perm.role in ['owner', 'admin']
            except SpaceMembership.DoesNotExist:
                pass

        if not has_edit_access:
            return Response(
                {"detail": "Только Owner или Admin могут выполнять откат версий."},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            # 1. Инкрементируем версию и обновляем контент страницы
            page.current_version += 1
            page.content = version.content
            page.updated_by = request.user
            page.save(update_fields=['content', 'current_version', 'updated_by'])

            # 2. Фиксируем откат как новую запись в истории
            WikiPageVersion.objects.create(
                page=page,
                version_number=page.current_version,
                content=version.content,
                comment=f"Откат к версии {version.version_number}",
                created_by=request.user
            )

        return Response({
            "detail": "Версия успешно восстановлена",
            "new_version_number": page.current_version,
            "restored_from": version.version_number
        }, status=status.HTTP_200_OK)