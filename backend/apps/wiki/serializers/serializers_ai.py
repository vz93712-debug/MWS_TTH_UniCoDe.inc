from rest_framework import serializers

class SmartImportSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, help_text="Исходный текст (Markdown или HTML)")
    file_type = serializers.ChoiceField(choices=["markdown", "html"], default="markdown")
    space_id = serializers.UUIDField(required=True, help_text="ID пространства для создания страницы")
    title = serializers.CharField(required=False, allow_blank=True, help_text="Заголовок страницы (опционально)")