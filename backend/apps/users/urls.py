from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserOrganizationRoleViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')
router.register(r'roles', UserOrganizationRoleViewSet, basename='user-role')

urlpatterns = [
    path('', include(router.urls)),
]
