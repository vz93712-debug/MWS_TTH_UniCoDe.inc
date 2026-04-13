def build_comment_tree(comments_flat: list, parent_id=None, depth=0) -> list:
    """
    Преобразует плоский список комментариев в древовидную структуру.
    """
    # Группируем по parent_id
    by_parent = {}
    for comment in comments_flat:
        pid = comment.get('parent') or comment.get('parent_id')
        comment_id = comment.get('id')
        
        
        if pid not in by_parent:
            by_parent[pid] = []
        by_parent[pid].append({**comment, 'children': []})
    
    
    # Строим дерево
    tree = []
    target_comments = by_parent.get(parent_id, [])
    
    for comment in target_comments:
        comment_id = comment['id']
        
        # Рекурсивно строим детей
        children = build_comment_tree(comments_flat, comment_id, depth + 1)
        comment['children'] = children
        
        tree.append(comment)
    
    return tree