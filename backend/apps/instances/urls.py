from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InstanceViewSet

router = DefaultRouter()
router.register(r'', InstanceViewSet, basename='instance')

urlpatterns = [
    path('', include(router.urls)),
]
