from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIAnalysisViewSet

router = DefaultRouter()
router.register(r'analysis', AIAnalysisViewSet, basename='ai-analysis')

urlpatterns = [
    path('', include(router.urls)),
]
