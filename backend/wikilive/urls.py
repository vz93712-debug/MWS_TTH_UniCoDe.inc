"""
URL configuration for wikilive project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.wiki.views.views_search import fulltext_search, search_users
from apps.wiki.views.views_images import upload_media

from apps.wiki.views.views_ai import (
    AIEditTextView, AITableGenerateView, AITaskStatusView, 
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

    path('api/v1/auth/', include('apps.users.urls'), ),

    path('api/v1/spaces/', include('apps.spaces.urls'), ), 

    path('api/v1/pages/', include('apps.wiki.urls.base'), ),
    path('api/v1/mws/', include('apps.wiki.urls.mws'), ),  

    path('api/v1/search/', fulltext_search, name='fulltext-search'), 
    path('api/v1/search/users/', search_users, name='users-search'), 
    path('api/v1/media/upload/', upload_media, name='upload-media'), 

    path("api/v1/ai/generate-table/", AITableGenerateView.as_view(), name="ai-generate-table"),
    path("api/v1/ai/edit-text/", AIEditTextView.as_view(), name="ai-edit-text"),
    path("api/v1/ai/tasks/<str:task_id>/", AITaskStatusView.as_view(), name="ai-task-status"),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)