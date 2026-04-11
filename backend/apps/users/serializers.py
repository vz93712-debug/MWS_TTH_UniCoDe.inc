from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = (
            'email', 'username', 'password',
            'first_name', 'last_name', 'phone_number', 'mws_api_token'
        )

    def validate_password1(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Неверный email или пароль.', code='authorization')
            
            if not user.is_active:
                raise serializers.ValidationError('Аккаунт деактивирован.', code='authorization')
        else:
            raise serializers.ValidationError('Поля "email" и "password" обязательны.', code='authorization')

        data['user'] = user
        return data

    def get_tokens(self, user):
        """Генерирует пару JWT токенов."""

        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'mws_api_token', 'is_staff', 'is_superuser', 
            'created_at', 'last_login'
        )
        read_only_fields = ('id', 'username', 'email', 'is_staff', 'is_superuser', 'created_at', 'last_login')