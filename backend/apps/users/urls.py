from django.urls import path 
from rest_framework_simplejwt.views import (
    TokenRefreshView, 
    TokenVerifyView, 
    TokenObtainPairView
)
from .views import RegisterView, LoginView, LogoutView, UserProfileView



urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('register/', RegisterView.as_view(), name='register'), 
    path('login/', LoginView.as_view(), name='login'), 
    path('logout/', LogoutView.as_view(), name='logout'), 
    path('me/', UserProfileView.as_view(), name='user_profile'), 

]