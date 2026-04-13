from rest_framework import serializers

# ============================================================================
# 🌐 БАЗОВЫЕ УТИЛИТЫ
# ============================================================================
class FlexibleQuerySerializer(serializers.Serializer):
    """
    Позволяет передавать любые query-параметры, не описанные явно.
    Используется для мобильности: фронтенд может слать новые параметры MWS API 
    без необходимости обновлять бэкенд.
    """
    def to_internal_value(self, data):
        # Возвращаем данные как есть, пропуская валидацию неизвестных полей
        return data


class CommaSeparatedListField(serializers.ListField):
    """
    Принимает либо список, либо строку через запятую: "a,b,c" → ["a", "b", "c"]
    """
    def to_internal_value(self, data):
        if isinstance(data, str):
            data = [item.strip() for item in data.split(',') if item.strip()]
        return super().to_internal_value(data)

# ============================================================================
# 📁 SPACES & NODES
# ============================================================================
class SpaceListQuerySerializer(serializers.Serializer):
    # Параметры для GET /fusion/v1/spaces отсутствуют, оставлено для консистентности
    pass


class NodeListQuerySerializer(serializers.Serializer):
    type = serializers.IntegerField(
        required=False, 
        help_text="Тип запрашиваемой ноды. Если передан, поиск по всему пространству."
    )


class NodeDetailSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    type = serializers.CharField(read_only=True)
    icon = serializers.CharField(read_only=True, allow_null=True)
    is_fav = serializers.BooleanField(read_only=True, source='isFav')
    permission = serializers.IntegerField(read_only=True)
    children = serializers.ListField(child=serializers.DictField(), read_only=True, allow_null=True)


class CreateDatasheetSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    folder_id = serializers.CharField(required=False, allow_null=True, source='folderId')
    pre_node_id = serializers.CharField(required=False, allow_null=True, source='preNodeId')
    fields = serializers.ListField(
        child=serializers.DictField(), 
        required=False, 
        default=list,
        help_text="Массив полей таблицы. Каждый элемент: {type, name, property}"
    )


# ============================================================================
# 📊 RECORDS (ЗАПИСИ)
# ============================================================================
class GetRecordsQuerySerializer(serializers.Serializer):
    view_id = serializers.CharField(required=False, source='viewId')
    page_size = serializers.IntegerField(required=False, default=100, min_value=1, max_value=1000, source='pageSize')
    max_records = serializers.IntegerField(required=False, min_value=1, source='maxRecords')
    page_num = serializers.IntegerField(required=False, default=1, min_value=1, source='pageNum')
    sort = serializers.JSONField(
        required=False, 
        help_text="Массив правил сортировки: [{'order': 'asc'|'desc', 'field': 'name'}]"
    )
    record_ids = serializers.ListField(child=serializers.CharField(), required=False, source='recordIds')
    fields = CommaSeparatedListField(
        child=serializers.CharField(), 
        required=False,
        help_text="Список полей: ?fields=field1,field2 или ?fields=field1&fields=field2"
    )
    filter_by_formula = serializers.CharField(required=False, source='filterByFormula')
    cell_format = serializers.ChoiceField(choices=['string', 'json'], required=False, default='json', source='cellFormat')
    field_key = serializers.ChoiceField(choices=['name', 'id'], required=False, default='name', source='fieldKey')


class CreateRecordsSerializer(serializers.Serializer):
    records = serializers.ListField(
        child=serializers.DictField(), 
        min_length=1, 
        max_length=100,  # Лимит MWS API
        help_text="Массив записей для создания. Максимум 100 за раз."
    )
    field_key = serializers.ChoiceField(choices=['name', 'id'], default='name', source='fieldKey')


class UpdateRecordsSerializer(serializers.Serializer):
    records = serializers.ListField(
        child=serializers.DictField(), 
        min_length=1, 
        max_length=100  # Лимит MWS API
    )
    field_key = serializers.ChoiceField(choices=['name', 'id'], default='name', source='fieldKey')


class DeleteRecordsQuerySerializer(serializers.Serializer):
    record_ids = serializers.ListField(
        child=serializers.CharField(), 
        required=True, 
        source='recordIds',
        help_text="Идентификаторы записей для удаления"
    )


# ============================================================================
# 🧩 FIELDS (ПОЛЯ)
# ============================================================================
class CreateFieldSerializer(serializers.Serializer):
    type = serializers.CharField(help_text="Тип поля: SingleText, Number, DateTime, OneWayLink и т.д.")
    name = serializers.CharField(max_length=100)
    property = serializers.DictField(required=False, allow_null=True, help_text="Специфичные настройки типа поля")


class UpdateFieldIndexSerializer(serializers.Serializer):
    index = serializers.IntegerField(min_value=1, help_text="Новый порядок поля (не может быть 0)")


# ============================================================================
# 👁️ VIEWS (ПРЕДСТАВЛЕНИЯ)
# ============================================================================
class CreateViewSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    properties = serializers.DictField(
        help_text="Конфигурация представления: {type: 'Grid'|'Kanban'|'Gantt', settings: {...}}"
    )


class UpdateViewNameSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)


class ViewSortSerializer(serializers.Serializer):
    data = serializers.DictField(required=True, help_text="{'rules': [...], 'keepSort': bool}")
    apply_sort = serializers.BooleanField(required=False, default=True, source='applySort')


class ViewGroupSerializer(serializers.Serializer):
    data = serializers.ListField(child=serializers.DictField(), required=True)


class ViewHideFieldsSerializer(serializers.Serializer):
    data = serializers.ListField(child=serializers.DictField(), required=True)


class ViewMoveSerializer(serializers.Serializer):
    data = serializers.DictField(required=True, help_text="{'newIndex': int}")


# ============================================================================
# 📎 ATTACHMENTS (ВЛОЖЕНИЯ)
# ============================================================================
class AttachmentDownloadQuerySerializer(serializers.Serializer):
    token = serializers.CharField(required=True, help_text="Токен вложения из MWS Tables")


class UploadAttachmentSerializer(serializers.Serializer):
    file = serializers.FileField()
    # record_id и field_id обычно передаются как query-params, но валидируем их здесь для безопасности
    record_id = serializers.CharField(required=False, allow_null=True, source='recordId')
    field_id = serializers.CharField(required=False, allow_null=True, source='fieldId')

    def validate(self, attrs):
        record_id = attrs.get('record_id')
        field_id = attrs.get('field_id')
        if bool(record_id) != bool(field_id):
            raise serializers.ValidationError("recordId и fieldId должны быть указаны вместе или оба пропущены.")
        return attrs