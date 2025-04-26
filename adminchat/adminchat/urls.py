"""
URL configuration for adminchat project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from adminchat.views import (
    BusinessViewSet,
    BusinessUserViewSet,
    RoleViewSet,
    UserActivityLogViewSet,
    CustomTokenObtainPairView,
    DashboardStatsView,
    BotSettingsViewSet,
    BotTemplateViewSet,
    health_check
)
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="API de AdminChat",
      default_version='v1',
      description="Documentación completa de los endpoints",
      terms_of_service="https://jaiexperts.com/terms/",
      contact=openapi.Contact(email="jai@jaiexperts.com"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),  # O usa IsAuthenticated si prefieres
)


router = DefaultRouter()
router.register(r'api/businesses', BusinessViewSet)
router.register(r'api/users', BusinessUserViewSet, basename='user')
router.register(r'api/roles', RoleViewSet)
router.register(r'api/activity-logs', UserActivityLogViewSet, basename='activity-log')
# Añadir estas líneas después de la creación del router
router.register(r'api/bot-settings', BotSettingsViewSet, basename='bot-settings')
router.register(r'api/bot-templates', BotTemplateViewSet, basename='bot-template')

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/health/', health_check, name='health-check'),
    # Documentación
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
] + router.urls

