from rest_framework import serializers

class SmartImportSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, help_text="Исходный текст (Markdown или HTML)")
    file_type = serializers.ChoiceField(choices=["markdown", "html"], default="markdown")
    space_id = serializers.UUIDField(required=True, help_text="ID пространства для создания страницы")
    title = serializers.CharField(required=False, allow_blank=True, help_text="Заголовок страницы (опционально)")


class ReportGenerationSerializer(serializers.Serializer):
    dst_id = serializers.CharField(required=True, help_text="ID таблицы MWS (datasheet)")
    space_id = serializers.UUIDField(required=True, help_text="ID пространства для создания страницы отчёта")
    prompt = serializers.CharField(required=True, help_text="Контекст/запрос: что именно нужно проанализировать")
    limit = serializers.IntegerField(required=False, default=100, min_value=1, max_value=200, help_text="Макс. записей для анализа (защита от переполнения контекста)")
    report_type = serializers.ChoiceField(
        required=False, 
        choices=["summary", "analysis", "table", "custom"], 
        default="summary", 
        help_text="Тип отчёта: краткий, аналитический, табличный, произвольный"
    )

class PageSummarizeSerializer(serializers.Serializer):
    page_id = serializers.UUIDField(required=True)
    style = serializers.ChoiceField(choices=["bullets", "paragraph"], default="bullets")


class DiffExplainSerializer(serializers.Serializer):
    page_id = serializers.UUIDField(required=True, help_text="ID страницы для проверки доступа")
    version_id_from = serializers.UUIDField(required=False, allow_null=True, help_text="ID старой версии (если нет — берём предыдущую)")
    version_id_to = serializers.UUIDField(required=False, allow_null=True, help_text="ID новой версии (если нет — берём текущую)")

