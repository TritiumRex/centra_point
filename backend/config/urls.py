from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def health(request):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('api/health/', health),
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/organizations/', include('apps.organizations.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/things/', include('apps.things.urls')),
    path('api/instances/', include('apps.instances.urls')),
    path('api/ai/', include('apps.ai.urls')),
    path('api/mail/', include('apps.mail.urls')),
    path('api/proxy/', include('apps.proxy.urls')),
    path('api/menu/', include('apps.menu.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
