from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'nodes', views.MenuNodeViewSet, basename='menunode')

urlpatterns = [
    path('tree/', views.menu_tree),
    path('', include(router.urls)),
]
