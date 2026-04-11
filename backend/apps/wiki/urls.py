from django.urls import path

from apps.wiki.views.views_page import (
    WikiPageDetailView, WikiPageMoveView, 
)
from apps.wiki.views.views_versions import (
    VersionListView, 
    VersionDetailView, 
    VersionRestoreView
)
from apps.wiki.views.views_comments import (
    CommentListView, 
    CommentDetailView, 
)
from apps.wiki.views.views_sync import (
    PresenceView, 
    SyncStateView
)


urlpatterns = [
    # Детальная страница: Чтение, Обновление (Ctrl+S), Удаление
    path('<uuid:page_id>/', WikiPageDetailView.as_view(), name='wiki-page-detail'),
    
    # Перемещение страницы
    path('<uuid:page_id>/move/', WikiPageMoveView.as_view(), name='wiki-page-move'),

    # Версионирование
    path('<uuid:page_id>/versions/', VersionListView.as_view(), name='page-versions-list'),
    path('<uuid:page_id>/versions/<uuid:version_id>/', VersionDetailView.as_view(), name='page-version-detail'),
    path('<uuid:page_id>/versions/<uuid:version_id>/restore/', VersionRestoreView.as_view(), name='page-version-restore'),

    path('<uuid:page_id>/comments/', CommentListView.as_view(), name='page-comments'),
    path('comments/<uuid:comment_id>/', CommentDetailView.as_view(), name='comment-detail'),

    path('<uuid:page_id>/sync-state/', SyncStateView.as_view(), name='page-sync-state'),
    path('<uuid:page_id>/presence/', PresenceView.as_view(), name='page-presence'),

]