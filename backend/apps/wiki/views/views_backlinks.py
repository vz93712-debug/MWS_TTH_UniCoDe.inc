from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404

from apps.wiki.models import WikiPage, PageLink
from apps.wiki.serializers.serializers_backlinks import LinkedPageSerializer
from apps.wiki.permissions import IsSpaceOrPageMember


class BacklinksView(APIView):
    """
    GET /pages/{page_id}/backlinks/
    Страницы, которые ссылаются НА текущую (incoming_links)
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        # related_name='incoming_links' в модели PageLink указывает на target
        qs = page.incoming_links.select_related('source').order_by('-created_at')
        pages = [link.source for link in qs]
        return Response(LinkedPageSerializer(pages, many=True).data)


class OutgoingLinksView(APIView):
    """
    GET /pages/{page_id}/outgoing-links/
    Страницы, на которые ссылается ТЕКУЩАЯ (outgoing_links)
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, page_id):
        page = get_object_or_404(WikiPage, id=page_id)
        qs = page.outgoing_links.select_related('target').order_by('-created_at')
        pages = [link.target for link in qs]
        return Response(LinkedPageSerializer(pages, many=True).data)


class SpaceGraphView(APIView):
    """
    GET /spaces/{space_id}/graph/
    Данные для визуализации графа связей в пространстве
    """
    permission_classes = [permissions.IsAuthenticated, IsSpaceOrPageMember]

    def get(self, request, space_id):
        # 1. Берём ВСЕ страницы пространства как узлы графа
        pages = WikiPage.objects.filter(space_id=space_id).values('id', 'title')
        
        nodes = [
            {"id": str(page['id']), "label": page['title']}
            for page in pages
        ]

        # 2. Берём связи ТОЛЬКО между страницами этого пространства
        links = PageLink.objects.filter(
            source__space_id=space_id,
            target__space_id=space_id  # исключаем кросс-спейс ссылки из графа
        ).values('source_id', 'target_id')
        
        edges = [
            {"source": str(link['source_id']), "target": str(link['target_id'])}
            for link in links
        ]

        return Response({
            "nodes": nodes,
            "links": edges
        })