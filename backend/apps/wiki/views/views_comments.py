from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from apps.wiki.models import WikiPage, Comment, PageMembership
from apps.spaces.models import SpaceMembership
from apps.wiki.serializers.serializers_comments import CommentSerializer, CommentTreeSerializer
from apps.wiki.permissions import IsSpaceOrPageMember
from apps.wiki.utils.comments import build_comment_tree 


class CommentListView(APIView):
    """
    GET  /pages/{page_id}/comments/  (с фильтрами ?mark_id=...&parent_id=...&tree=1)
    POST /pages/{page_id}/comments/
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        
        qs = Comment.objects.filter(page=page).select_related('user', 'parent').prefetch_related('replies')
        
        # Фильтры
        mark_id = request.query_params.get('mark_id')
        parent_id = request.query_params.get('parent_id')
        tree_mode = request.query_params.get('tree', '').lower() == '1'
        
        if mark_id:
            qs = qs.filter(mark_id=mark_id)
        if parent_id:
            qs = qs.filter(parent_id=parent_id)
        else:
            # Если нет фильтра по parent — показываем только корневые
            qs = qs.filter(parent__isnull=True)
        
        # Сортировка: сначала старые
        comments = qs.order_by('created_at')
        
        if tree_mode:
            # Древовидный режим: сериализуем плоский список → строим дерево
            flat_data = CommentSerializer(comments, many=True, context={'request': request}).data
            tree_data = build_comment_tree(flat_data)
            return Response(tree_data)
        else:
            # Плоский режим
            serializer = CommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)

    def post(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        serializer = CommentSerializer(
            data=request.data, 
            context={'request': request, 'page': page}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommentDetailView(APIView):
    """
    PATCH /comments/{comment_id}/
    DELETE /comments/{comment_id}/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, comment_id):
        return get_object_or_404(Comment, id=comment_id)

    def _check_comment_permission(self, request, comment):
        """Автор или Admin/Owner страницы может редактировать/удалять."""
        if comment.user == request.user:
            return True
        try:
            perm = PageMembership.objects.get(page=comment.page, user=request.user)
            if perm.role in ['owner', 'admin']:
                return True
        except PageMembership.DoesNotExist:
            pass
        try:
            space_perm = SpaceMembership.objects.get(space=comment.page.space, user=request.user)
            if space_perm.role in ['owner', 'admin']:
                return True
        except SpaceMembership.DoesNotExist:
            pass
        return False

    def patch(self, request, comment_id):
        comment = self.get_object(comment_id)
        if not self._check_comment_permission(request, comment):
            return Response(
                {"detail": "Нет прав для редактирования этого комментария."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        if comment.user != request.user:
            return Response(
                {"detail": "Редактировать комментарий может только его автор."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CommentSerializer(
            comment, 
            data=request.data, 
            partial=True, 
            context={'request': request, 'page': comment.page}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, comment_id):
        comment = self.get_object(comment_id)
        if not self._check_comment_permission(request, comment):
            return Response(
                {"detail": "Нет прав для удаления этого комментария."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        comment.delete()  # CASCADE удалит все replies автоматически
        return Response(status=status.HTTP_204_NO_CONTENT)