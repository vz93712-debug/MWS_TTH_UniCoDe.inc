from django.contrib.postgres.search import SearchQuery, SearchRank, SearchHeadline
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.wiki.models import WikiPage, LinkedEntity
from django.db.models import Q
from apps.users.models import User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fulltext_search(request):
    """
    Полнотекстовый поиск с ранжированием и подсветкой результатов.
    Пример: GET /api/v1/search/?q=бюджет&space_id=123&type=page,datasheet
    """
    q = request.GET.get('q', '').strip()
    space_id = request.GET.get('space_id')
    
    # Парсим типы (по умолчанию ищем везде)
    types_param = request.GET.get('type', 'page,datasheet')
    search_types = [t.strip() for t in types_param.split(',')]

    if not q:
        return Response({"success": True, "results": []})

    # Инициализируем поисковый запрос с поддержкой русской морфологии
    query = SearchQuery(q, config='russian')
    results = []

    # === 1. ПОИСК ПО СТРАНИЦАМ (WikiPage) ===
    if 'page' in search_types:
        pages_qs = WikiPage.objects.filter(
            search_vector=query
        ).annotate(
            # Ранжируем результаты (насколько точно совпадение)
            rank=SearchRank('search_vector', query),
            # Киллер-фича: генерируем сниппет текста с подсвеченным словом
            headline=SearchHeadline(
                'description', 
                query, 
                config='russian',
                start_sel='<mark class="bg-yellow-200">', # Теги для TailwindCSS
                stop_sel='</mark>',
            )
        )

        # Фильтруем по пространству, если передано
        if space_id:
            pages_qs = pages_qs.filter(space_id=space_id)

        # Сортируем по релевантности и отбрасываем мусор (rank > 0.05)
        pages_qs = pages_qs.filter(rank__gte=0.05).order_by('-rank')[:15]

        for p in pages_qs:
            results.append({
                "id": p.id,
                "type": "page",
                "title": p.title,
                # Если в описании не нашлось слова, отдаем просто первые 100 символов
                "snippet": p.headline if 'mark' in (p.headline or '') else p.description[:100],
                "rank": p.rank,
                "space_id": p.space_id,
                "url": f"/space/{p.space_id}/page/{p.id}"
            })

    # === 2. ПОИСК ПО ТАБЛИЦАМ (LinkedEntity) ===
    if 'datasheet' in search_types:
        # Ищем привязанные таблицы, которые находятся на страницах, соответствующих запросу
        # Либо можно искать по названию самой таблицы (если вы сохраняете его в render_config)
        datasheets_qs = LinkedEntity.objects.filter(
            entity_type='datasheet',
            page__search_vector=query
        ).select_related('page')

        if space_id:
            datasheets_qs = datasheets_qs.filter(page__space_id=space_id)
            
        datasheets_qs = datasheets_qs[:10]

        for d in datasheets_qs:
            # Чтобы не дублировать, проверяем, нет ли уже этой страницы в результатах
            if not any(r['id'] == d.page.id and r['type'] == 'datasheet' for r in results):
                # Достаем имя таблицы из JSON (если вы его туда кэшируете при создании)
                table_name = d.render_config.get('tableName', f"Таблица {d.mws_id}")
                results.append({
                    "id": d.id,
                    "type": "datasheet",
                    "title": table_name,
                    "snippet": f"Встроено на странице: {d.page.title}",
                    "mws_id": d.mws_id,
                    "rank": 0.5, # Фиксированный ранг или можно рассчитать
                    "space_id": d.page.space_id,
                    "url": f"/space/{d.page.space_id}/page/{d.page.id}?scrollTo={d.mws_id}"
                })

    # Сортируем общий массив результатов по рангу (от большего к меньшему)
    results = sorted(results, key=lambda x: x['rank'], reverse=True)

    return Response({
        "success": True,
        "count": len(results),
        "results": results
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """
    Поиск пользователей с возможностью фильтрации по пространству.
    Примеры:
    1. Глобальный поиск: GET /api/v1/users/search/?q=ivan
    2. Поиск внутри пространства: GET /api/v1/users/search/?q=ivan&space_id=uuid-123
    """
    query = request.GET.get('q', '').strip()
    space_id = request.GET.get('space_id')

    # Если запрос пустой, ничего не ищем
    if not query:
        return Response({"success": True, "users": []})

    # Базовый фильтр по тексту (username или email)
    users = User.objects.filter(
        Q(username__icontains=query) | Q(email__icontains=query)
    )

    # ЕСЛИ передан space_id -> фильтруем только тех, кто состоит в этом пространстве
    if space_id:
        # spacemembership - это стандартное имя обратной связи от User к SpaceMembership
        # distinct() нужен, чтобы избежать дублей, если у юзера вдруг несколько записей (хотя по модели unique_together это исключено)
        users = users.filter(spacemembership__space_id=space_id).distinct()

    # Возвращаем только нужные поля
    users = users.values(
        'id', 
        'username', 
        'email', 
        'first_name', 
        'last_name'
    )[:20] 

    return Response({
        "success": True,
        "users": list(users)
    })