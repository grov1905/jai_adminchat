
# adminchat/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from adminchat.views import (
    BusinessViewSet,
    BusinessUserViewSet,
    RoleViewSet,
    UserActivityLogViewSet,
    CustomTokenObtainPairView,
    DashboardStatsView,
    BotSettingsViewSet,
    BotTemplateViewSet,
    health_check,
    ChunkingSettingsViewSet,
    ExternalAPIConfigViewSet,
    APIRouteViewSet,
    GatewayView,
    ProductServiceItemViewSet,
    DocumentViewSet,
    EmbeddingViewSet,
    TaskStatusView
    
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
router.register(r'api/chunking-settings', ChunkingSettingsViewSet, basename='chunking-settings')
router.register(r'api/external-api-configs', ExternalAPIConfigViewSet, basename='external-api-configs')
router.register(r'api/api-routes', APIRouteViewSet, basename='api-routes')
router.register(r'api/product-service-items', ProductServiceItemViewSet, basename='product-service-item')
router.register(r'api/documents', DocumentViewSet, basename='document')
router.register(r'api/embeddings', EmbeddingViewSet, basename='embedding')

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/tasks/<uuid:task_id>/status/', TaskStatusView.as_view(), name='task-status'),

    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/health/', health_check, name='health-check'),
#    path('api/chunking-settings', ChunkingSettingsViewSet, name='chunking-settings'),
#    path('api/embeddings', EmbeddingViewSet, name='embedding'),


    # Documentación
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
     # Endpoint de proxy
    re_path(r'^api/gateway/(?P<path>.*)$', GatewayView.as_view()),

] + router.urls

