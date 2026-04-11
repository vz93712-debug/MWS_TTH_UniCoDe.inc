def build_comment_tree(comments_flat: list, parent_id=None) -> list:
    """
    Преобразует плоский список комментариев в древовидную структуру.
    Работает за O(N), без рекурсивных запросов к БД.
    
    :param comments_flat: список dict (уже сериализованных) с полем 'parent_id'
    :param parent_id: ID родителя, для которого строим дерево (None = корневые)
    :return: список комментариев с вложенным полем 'children'
    """
    # Группируем комментарии по parent_id
    by_parent = {}
    for comment in comments_flat:
        pid = comment.get('parent_id')
        if pid not in by_parent:
            by_parent[pid] = []
        by_parent[pid].append({**comment, 'children': []})
    
    # Строим дерево
    tree = []
    for comment in by_parent.get(parent_id, []):
        comment['children'] = build_comment_tree(comments_flat, comment['id'])
        tree.append(comment)
    
    return tree