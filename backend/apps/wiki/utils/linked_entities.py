# apps/wiki/utils.py
import re
from django.db import transaction
from apps.wiki.models import WikiPage, LinkedEntity

def sync_linked_entities(page: WikiPage):
    content = page.content

    if not isinstance(content, dict):
        return

    found = {}

    # Lexical всегда оборачивает контент в объект {"root": {...}}
    root_node = content.get('root', content)

    def traverse(node, depth=0):
        indent = "  " * depth
        if isinstance(node, dict):
            node_type = node.get('type')
            dataset = node.get('dataset', {})
            
            if node_type in ('live-table-node', 'live-view-node', 'live-datasheet-node'):
                dst_id = dataset.get('datasheetId')
                viw_id = dataset.get('viewId')

                if dst_id and viw_id:
                    found[(dst_id, viw_id)] = {
                        **dataset,
                        'viewType': dataset.get('viewType', 'grid'),
                        'filters': dataset.get('filters', {}),
                        'columns': dataset.get('columns', []),
                    }

            # Рекурсивно обходим children
            for child in node.get('children', []):
                traverse(child, depth + 1)
                
        elif isinstance(node, list):
            for item in node:
                traverse(item, depth)

    traverse(root_node)

    try:
        with transaction.atomic():
            current = {
                (le.mws_id, le.render_config.get('viewId')): le.render_config
                for le in LinkedEntity.objects.filter(page=page, entity_type='datasheet')
            }

            to_create = set(found.keys()) - set(current.keys())
            to_update = set(found.keys()) & set(current.keys())
            to_delete = set(current.keys()) - set(found.keys())


            if to_create:
                LinkedEntity.objects.bulk_create([
                    LinkedEntity(
                        page=page,
                        entity_type='datasheet',
                        mws_id=dst_id,
                        render_config={**cfg, 'viewId': viw_id}
                    ) for (dst_id, viw_id), cfg in found.items() if (dst_id, viw_id) in to_create
                ])

            if to_update:
                for dst_id, viw_id in to_update:
                    LinkedEntity.objects.filter(
                        page=page, entity_type='datasheet', mws_id=dst_id, render_config__viewId=viw_id
                    ).update(render_config={**found[(dst_id, viw_id)], 'viewId': viw_id})

            if to_delete:
                LinkedEntity.objects.filter(page=page).filter(
                    entity_type='datasheet',
                    mws_id__in=[k[0] for k in to_delete],
                    render_config__viewId__in=[k[1] for k in to_delete]
                ).delete()

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise

