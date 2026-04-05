from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ThingViewSet

router = DefaultRouter()
router.register(r'', ThingViewSet, basename='thing')

urlpatterns = [
    path('', include(router.urls)),
]
