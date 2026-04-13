from django.urls import path
from apps.wiki.views.views_mws import (
    MWSSpacesView, MWSNodesView, MWSNodeDetailView,
    MWSDatasheetCreateView, MWSDatasheetDeleteView,
    MWSRecordsView,
    MWSFieldsView, MWSFieldCreateView, MWSFieldDeleteView, MWSFieldIndexView,
    MWSViewsView, MWSViewDetailView, MWSViewSortView, MWSViewGroupView, MWSViewHiddenView, MWSViewMoveView,
    MWSAttachmentDownloadView, MWSAttachmentUploadView
)

# Добавляем к существующим urlpatterns
urlpatterns = [
    # === MWS PROXY LAYER ===
    
    # Spaces & Nodes
    path('spaces/', MWSSpacesView.as_view(), name='mws-spaces'),
    path('spaces/<str:space_id>/nodes/', MWSNodesView.as_view(), name='mws-nodes'),
    path('nodes/<str:node_id>/', MWSNodeDetailView.as_view(), name='mws-node-detail'),
    
    # Datasheets
    path('spaces/<str:space_id>/datasheets/', MWSDatasheetCreateView.as_view(), name='mws-datasheet-create'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/', MWSDatasheetDeleteView.as_view(), name='mws-datasheet-delete'),
    
    # Records
    path('datasheets/<str:dst_id>/records/', MWSRecordsView.as_view(), name='mws-records'),
    
    # Fields
    path('datasheets/<str:dst_id>/fields/', MWSFieldsView.as_view(), name='mws-fields'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/fields/', MWSFieldCreateView.as_view(), name='mws-field-create'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/fields/<str:field_id>/', MWSFieldDeleteView.as_view(), name='mws-field-delete'),
    path('datasheets/<str:dst_id>/views/<str:view_id>/fields/<str:field_id>/', MWSFieldIndexView.as_view(), name='mws-field-index'),
    
    # Views
    # path('datasheets/<str:dst_id>/views/', MWSViewsView.as_view(), name='mws-views'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/views/', MWSViewsView.as_view(), name='mws-views-create'), # POST handled inside
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/views/<str:view_id>/', MWSViewDetailView.as_view(), name='mws-view-detail'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/views/<str:view_id>/sort/', MWSViewSortView.as_view(), name='mws-view-sort'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/views/<str:view_id>/group/', MWSViewGroupView.as_view(), name='mws-view-sort'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/views/<str:view_id>/hidden/', MWSViewHiddenView.as_view(), name='mws-view-sort'),
    path('spaces/<str:space_id>/datasheets/<str:dst_id>/views/<str:view_id>/move/', MWSViewMoveView.as_view(), name='mws-view-sort'),
    
    # Attachments
    path('datasheets/<str:dst_id>/attachments/', MWSAttachmentDownloadView.as_view(), name='mws-attachments'),
    path('datasheets/<str:dst_id>/attachments/upload/', MWSAttachmentUploadView.as_view(), name='mws-attachments-upload'),
]