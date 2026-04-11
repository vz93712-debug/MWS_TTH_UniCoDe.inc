from django.urls import path

from apps.wiki.views import (
    WikiPageDetailView, WikiPageMoveView, 

)

urlpatterns = [
    # Детальная страница: Чтение, Обновление (Ctrl+S), Удаление
    path('<uuid:page_id>/', WikiPageDetailView.as_view(), name='wiki-page-detail'),
    
    # Перемещение страницы
    path('<uuid:page_id>/move/', WikiPageMoveView.as_view(), name='wiki-page-move'),
]