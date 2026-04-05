from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailAccountViewSet

router = DefaultRouter()
router.register(r'accounts', EmailAccountViewSet, basename='email-account')

urlpatterns = [
    path('', include(router.urls)),
]
