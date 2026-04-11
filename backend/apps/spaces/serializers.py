from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.spaces.models import Space, SpaceMembership
from apps.wiki.models import WikiPage

User = get_user_model()


class SpaceMemberSerializer(serializers.ModelSerializer):
    """
    Легковесный сериализатор для вложенного вывода участников.
    Используется внутри SpaceDetailSerializer.
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_display_name = serializers.SerializerMethodField()

    class Meta:
        model = SpaceMembership
        fields = ('id', 'user_email', 'user_display_name', 'role')

    def get_user_display_name(self, obj):
        return f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip() or obj.user.email


class SpaceListSerializer(serializers.ModelSerializer):
    """
    Для GET /api/v1/spaces/
    Минимальный набор полей + роль текущего пользователя и кол-во участников.
    """
    current_user_role = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Space
        fields = ('id', 'name', 'description', 'current_user_role', 'members_count', 'created_at')

    def get_current_user_role(self, obj):
        # ViewSet должен аннотировать queryset: .annotate(user_role=Subquery(...))
        return getattr(obj, 'user_role', None)

    def get_members_count(self, obj):
        # ViewSet должен аннотировать: .annotate(members_count=Count('members'))
        return getattr(obj, 'members_count', 0)


class SpaceCreateSerializer(serializers.ModelSerializer):
    """
    Для POST /api/v1/spaces/
    Автоматически привязывает текущего пользователя как owner.
    """
    class Meta:
        model = Space
        fields = ('name', 'description')

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class SpaceUpdateSerializer(serializers.ModelSerializer):
    """
    Для PATCH /api/v1/spaces/{space_id}/
    Разрешает редактировать только название и описание.
    """
    class Meta:
        model = Space
        fields = ('name', 'description')


class SpaceDetailSerializer(serializers.ModelSerializer):
    """
    Для GET /api/v1/spaces/{space_id}/
    Возвращает полные данные пространства + список участников + мета-информацию.
    """
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_name = serializers.SerializerMethodField()
    members = SpaceMemberSerializer(many=True, read_only=True)
    pages_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Space
        fields = (
            'id', 'name', 'description', 'owner_email', 'owner_name', 
            'members', 'pages_count', 'created_at', 'updated_at'
        )

    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.email



class SpaceMemberListSerializer(serializers.ModelSerializer):
    """
    Сериализатор для ЧТЕНИЯ (GET).
    Возвращает красивую информацию о пользователе (email, имя), 
    но не принимает данные для записи.
    """
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_display_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SpaceMembership
        fields = ('id', 'user_id', 'user_email', 'user_display_name', 'role', 'created_at')

    def get_user_display_name(self, obj):
        # Формируем имя или берем email, если имени нет
        name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return name if name else obj.user.email


class SpaceMemberActionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для ЗАПИСИ (POST/PUT/PATCH).
    Принимает ID пользователя и роль.
    """
    # ВАЖНО: PrimaryKeyRelatedField ожидает UUID. 
    # Если хочешь приглашать по username (например, "arseniy"), раскомментируй строку ниже:
    # user = serializers.SlugRelatedField(queryset=User.objects.all(), slug_field='username')
    
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False  # False, чтобы разрешить обновление роли без передачи user
    )
    
    role = serializers.ChoiceField(choices=SpaceMembership.ROLE_CHOICES)

    class Meta:
        model = SpaceMembership
        fields = ('user', 'role')

    def validate(self, data):
        space = self.context['space']
        user = data.get('user')

        # --- Логика для СОЗДАНИЯ (POST) ---
        if not self.instance: 
            if not user:
                raise serializers.ValidationError({"user": "Поле 'user' обязательно при создании."})
            
            # Проверка: пользователь уже в пространстве?
            if SpaceMembership.objects.filter(space=space, user=user).exists():
                raise serializers.ValidationError("Этот пользователь уже является участником пространства.")
            
            # Защита: нельзя создать нового владельца через этот метод (владелец создается при создании Space)
            if data.get('role') == 'owner':
                raise serializers.ValidationError("Нельзя назначить роль 'owner' новому участнику через этот эндпоинт.")

        # --- Логика для ОБНОВЛЕНИЯ (PATCH/PUT) ---
        else:
            # Если передан user при обновлении, проверяем, не занят ли он другим местом
            if user and SpaceMembership.objects.filter(space=space, user=user).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Этот пользователь уже есть в пространстве с другой ролью.")
            
            # Защита: нельзя понизить роль существующего владельца
            if self.instance.role == 'owner' and data.get('role') != 'owner':
                raise serializers.ValidationError("Нельзя изменить роль владельца.")

        return data

    def to_representation(self, instance):
        """
        После создания/обновления возвращаем данные в формате ListSerializer,
        чтобы фронтенд сразу получил красивую карточку пользователя.
        """
        return SpaceMemberListSerializer(instance).data
    

class WikiPageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для вывода страницы в списке/дереве.
    Поле parent отдаётся как UUID-строка, что необходимо для сборщика дерева.
    """
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    # Явно указываем, что parent сериализуется как UUID, а не вложенный объект
    parent = serializers.UUIDField(source='parent.id', allow_null=True, read_only=True)

    class Meta:
        model = WikiPage
        fields = (
            'id', 'title', 'description', 'parent', 'order',
            'created_by_name', 'updated_by_name', 'current_version', 
            'created_at', 'updated_at'
        )

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.email
        return None


class WikiPageCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания страницы"""
    class Meta:
        model = WikiPage
        fields = ('title', 'description', 'parent', 'order')
        extra_kwargs = {
            'parent': {'required': False, 'allow_null': True},
            'order': {'required': False, 'default': 0},
            'description': {'required': False, 'allow_blank': True}
        }

    def validate_parent(self, value):
        if value:
            space = self.context.get('space')
            if space and value.space_id != space.id:
                raise serializers.ValidationError("Родительская страница должна быть в том же пространстве.")
        return value

    def create(self, validated_data):
        request = self.context['request']
        space = self.context['space']
        
        # Инициализация пустого Lexical JSON
        validated_data['content'] = {
            "root": {
                "type": "root", "children": [], "direction": "ltr",
                "format": "", "indent": 0, "version": 1
            }
        }
        validated_data['space'] = space
        validated_data['created_by'] = request.user
        validated_data['updated_by'] = request.user
        validated_data['current_version'] = 1
        
        return super().create(validated_data)