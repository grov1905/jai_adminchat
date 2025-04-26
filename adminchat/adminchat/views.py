# business/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from .models import Business, BusinessUser, Role, UserActivityLog, BotSettings, BotTemplate
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.utils import timezone
from django.db.models.functions import TruncMonth
from rest_framework_simplejwt.authentication import JWTAuthentication
from .pagination import StandardResultsSetPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import (
    BusinessSerializer,
    BusinessUserSerializer,
    RoleSerializer,
    UserActivityLogSerializer,
    CustomTokenObtainPairSerializer,
    BotSettingsSerializer,
    BotTemplateSerializer
)
from .permissions import (
    IsAdminUser,
    IsBusinessAdmin,
    IsSameBusinessUser
)
from rest_framework_simplejwt.views import TokenObtainPairView

class BusinessViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna la lista de negocios registrados.

    create:
    Crea un nuevo registro de negocio (requiere permisos de administrador).

    retrieve:
    Obtiene los detalles de un negocio específico.

    update:
    Actualiza todos los campos de un negocio.

    partial_update:
    Actualiza campos específicos de un negocio.

    destroy:
    Elimina un negocio (marca como inactivo).
    """
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'is_active',
                openapi.IN_QUERY,
                description="Filtrar por estado activo/inactivo",
                type=openapi.TYPE_BOOLEAN
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class RoleViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna la lista de roles disponibles.

    create:
    Crea un nuevo rol (requiere permisos de administrador).

    retrieve:
    Obtiene los detalles de un rol específico.

    update:
    Actualiza todos los campos de un rol.

    partial_update:
    Actualiza campos específicos de un rol.

    destroy:
    Elimina un rol.
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = StandardResultsSetPagination

class BusinessUserViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna la lista de usuarios registrados.

    create:
    Crea un nuevo usuario (requiere permisos de administrador).

    retrieve:
    Obtiene los detalles de un usuario específico.

    update:
    Actualiza todos los campos de un usuario.

    partial_update:
    Actualiza campos específicos de un usuario.

    destroy:
    Elimina un usuario (requiere permisos de administrador).
    """
    queryset = BusinessUser.objects.select_related('business', 'role')
    serializer_class = BusinessUserSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['business', 'role', 'is_active']
    pagination_class = StandardResultsSetPagination
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            permission_classes = [IsAuthenticated, IsAdminUser]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, (IsAdminUser | IsBusinessAdmin | IsSameBusinessUser)]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @swagger_auto_schema(
        operation_description="Obtiene los datos del usuario autenticado",
        responses={200: BusinessUserSerializer}
    )
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class UserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:
    Retorna el registro de actividades del usuario.

    retrieve:
    Obtiene los detalles de una actividad específica.
    """
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserActivityLog.objects.none()
        queryset = UserActivityLog.objects.all()
        if not self.request.user.is_superuser:
            queryset = queryset.filter(user=self.request.user)
        return queryset

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    post:
    Autentica un usuario y retorna tokens JWT.

    Parámetros requeridos:
    - email: Correo electrónico del usuario
    - password: Contraseña del usuario
    """
    serializer_class = CustomTokenObtainPairSerializer

class DashboardStatsView(APIView):
    """
    get:
    Retorna estadísticas generales del sistema.

    Permisos requeridos:
    - Usuario autenticado
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        responses={
            200: openapi.Response(
                description="Estadísticas del dashboard",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'business_stats': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'user_stats': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'last_updated': openapi.Schema(type=openapi.TYPE_STRING, format='date-time'),
                    }
                )
            )
        }
    )
    def get(self, request):
        business_stats = {
            'total': Business.objects.count(),
            'active': Business.objects.filter(is_active=True).count(),
            'inactive': Business.objects.filter(is_active=False).count(),
            'by_month': Business.objects.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(count=Count('id'))
        }

        user_stats = {
            'total': BusinessUser.objects.count(),
            'admins': BusinessUser.objects.filter(role__name='admin').count(),
            'staff': BusinessUser.objects.filter(role__name='staff').count(),
            'active': BusinessUser.objects.filter(is_active=True).count()
        }

        return Response({
            'business_stats': business_stats,
            'user_stats': user_stats,
            'last_updated': timezone.now()
        })

class BotSettingsViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna la configuración del bot para el negocio del usuario.

    create:
    Crea una nueva configuración de bot (requiere permisos de administrador o admin de negocio).

    retrieve:
    Obtiene los detalles de la configuración del bot.

    update:
    Actualiza todos los campos de la configuración del bot.

    partial_update:
    Actualiza campos específicos de la configuración del bot.

    destroy:
    Elimina la configuración del bot.
    """
    queryset = BotSettings.objects.select_related('business')
    serializer_class = BotSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return BotSettings.objects.none()
        queryset = super().get_queryset()
        if not self.request.user.is_superuser:
            queryset = queryset.filter(business=self.request.user.business)
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'business_id',
                openapi.IN_QUERY,
                description="ID del negocio",
                type=openapi.TYPE_STRING,
                format='uuid',
                required=True
            )
        ],
        responses={
            200: BotSettingsSerializer,
            400: "Parámetro business_id requerido",
            404: "Configuración no encontrada"
        }
    )
    @action(detail=False, methods=['get'])
    def by_business(self, request):
        business_id = request.query_params.get('business_id')
        if not business_id:
            return Response({'error': 'business_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            settings = BotSettings.objects.get(business_id=business_id)
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        except BotSettings.DoesNotExist:
            return Response({'error': 'Bot settings not found for this business'}, status=status.HTTP_404_NOT_FOUND)

class BotTemplateViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna las plantillas del bot para el negocio del usuario.

    create:
    Crea una nueva plantilla para el bot (requiere permisos de administrador o admin de negocio).

    retrieve:
    Obtiene los detalles de una plantilla específica.

    update:
    Actualiza todos los campos de una plantilla.

    partial_update:
    Actualiza campos específicos de una plantilla.

    destroy:
    Elimina una plantilla.
    """
    queryset = BotTemplate.objects.select_related('business')
    serializer_class = BotTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['business', 'type']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return BotTemplate.objects.none()
        queryset = super().get_queryset()
        if not self.request.user.is_superuser:
            queryset = queryset.filter(business=self.request.user.business)
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'business_id',
                openapi.IN_QUERY,
                description="ID del negocio",
                type=openapi.TYPE_STRING,
                format='uuid',
                required=True
            ),
            openapi.Parameter(
                'type',
                openapi.IN_QUERY,
                description="Tipo de plantilla (greeting, farewell, sales, support, other)",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        responses={
            200: BotTemplateSerializer(many=True),
            400: "Parámetros business_id y type requeridos"
        }
    )
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        business_id = request.query_params.get('business_id')
        template_type = request.query_params.get('type')
        
        if not business_id or not template_type:
            return Response(
                {'error': 'Both business_id and type parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        templates = BotTemplate.objects.filter(
            business_id=business_id,
            type=template_type
        )
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)

""" @swagger_auto_schema(
    methods=['get'],
    operation_description="Endpoint de health check",
    responses={
        200: openapi.Response(
            description="OK",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'status': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        )
    }
) """
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint that returns API status.
    No authentication required.
    """
    return Response({'status': 'OK'}, status=status.HTTP_200_OK)