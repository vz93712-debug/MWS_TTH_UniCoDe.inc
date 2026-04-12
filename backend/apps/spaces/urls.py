from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.spaces.views import SpaceViewSet, SpaceMembershipViewSet, WikiPageView

from apps.wiki.views.views_backlinks import SpaceGraphView

router = DefaultRouter()
router.register(r'', SpaceViewSet, basename='space')

# Для вложенных ресурсов (members) регистрируем отдельно, передавая space_id через kwargs
# Но лучше использовать явные пути для чистоты URL вложенности

membership_patterns = [
    path('', SpaceMembershipViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='space-members-list'),
    # Важно: параметр в URL называется 'user', но внутри используем 'user_id'
    path('<uuid:user>/', SpaceMembershipViewSet.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'put': 'update',
        'delete': 'destroy'
    }), name='space-members-detail'),
]


urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:space_id>/members/', include(membership_patterns)),
    path('<uuid:space_id>/pages/', WikiPageView.as_view(), name='wiki-page-list'),

    path('<uuid:space_id>/graph/', SpaceGraphView.as_view(), name='space-graph'),
]