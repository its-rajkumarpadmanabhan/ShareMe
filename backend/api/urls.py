from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, PostViewSet, DashboardView, UserProfileView, FollowToggleView, CollabRequestView, CollabRespondView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('users/<int:pk>/profile/', UserProfileView.as_view(), name='user-profile'),
    path('users/<int:pk>/follow/', FollowToggleView.as_view(), name='user-follow'),
    path('posts/<int:pk>/collab/request/', CollabRequestView.as_view(), name='collab-request'),
    path('posts/<int:pk>/collab/respond/', CollabRespondView.as_view(), name='collab-respond'),
    path('', include(router.urls)),
]
