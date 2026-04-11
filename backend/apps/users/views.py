from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.serializers import UserRegistrationSerializer, UserProfileSerializer, UserLoginSerializer
from drf_spectacular.utils import extend_schema


@extend_schema(
        summary='Регистрация нового пользователя'
)
class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя с выдачей JWT-токенов"""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
    

class LoginView(generics.GenericAPIView):
    """Вход в систему и получение токенов."""
    permission_classes = [permissions.AllowAny]
    serializer_class = UserLoginSerializer

    @extend_schema(
            summary='Вход в систему (получение токенов и объекта User)'
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        tokens = serializer.get_tokens(user)
        
        return Response({
            'user': UserProfileSerializer(user, context=self.get_serializer_context()).data,
            'tokens': tokens
        })


class LogoutView(APIView):
    """
    Выход из аккаунта: добавляет refresh-токен в чёрный список.
    Требует авторизации.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
            summary='Выход из системы (токены в blacklist)'
    )
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                auth_header = request.headers.get('Authorization', '')
                if auth_header.startswith('Bearer '):
                    return Response(
                        {'detail': 'Необходимо предоставить refresh токен.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                return Response(
                    {'detail': 'Необходимо предоставить refresh токен.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({'detail': 'Успешный выход из системы.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Ошибка при выходе: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
        summary='Получение данных текущего пользователя'
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """Получение и обновление данных текущего пользователя"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user