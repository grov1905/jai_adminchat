# admichat/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes,authentication_classes
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import MultiPartParser, JSONParser
from drf_yasg.utils import swagger_auto_schema  
from drf_yasg import openapi  
import logging
import json
from django.db.models import Count, Q
from django.utils import timezone
from django.db.models.functions import TruncMonth
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .models import  Business, BusinessUser, Role, UserActivityLog, BotSettings, BotTemplate, ChunkingSettings, ExternalAPIConfig, APIRoute, Document, ProductServiceItem, Embedding
from .pagination import StandardResultsSetPagination
from .services.gateway_service import GatewayService
from .services.storage_service import S3StorageService
from celery.result import AsyncResult
from django.db.models.functions import Cast
from pgvector.django import CosineDistance
from django.db.models import FloatField

from .serializers import (
    BusinessSerializer,
    BusinessUserSerializer,
    RoleSerializer,
    UserActivityLogSerializer,
    CustomTokenObtainPairSerializer,
    BotSettingsSerializer,
    BotTemplateSerializer,
    ChunkingSettingsSerializer,
    ExternalAPIConfigSerializer,
    APIRouteSerializer,
    DocumentSerializer,
    ProductServiceItemSerializer,
    EmbeddingSerializer,
    EmbeddingCreateSerializer
)
from .permissions import (
    IsAdminUser,
    IsBusinessAdmin,
    IsSameBusinessUser
)

logger = logging.getLogger(__name__)

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
    permission_classes = [IsAuthenticated]
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
    #permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin ]
    permission_classes = [AllowAny]  # Anula la configuración global

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
    #permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin | IsSameBusinessUser]
    permission_classes = [AllowAny]  # Anula la configuración global
    #authentication_classes = []  # Esto desactiva JWT para esta vista

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


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint that returns API status.
    No authentication required.
    """
    return Response({'status': 'OK'}, status=status.HTTP_200_OK)


# Añadir al final de business/views.py

class ChunkingSettingsViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna las configuraciones de chunking para el negocio del usuario.

    create:
    Crea una nueva configuración de chunking (requiere permisos de administrador o admin de negocio).

    retrieve:
    Obtiene los detalles de una configuración de chunking específica.

    update:
    Actualiza todos los campos de una configuración de chunking.

    partial_update:
    Actualiza campos específicos de una configuración de chunking.

    destroy:
    Elimina una configuración de chunking.
    """
    queryset = ChunkingSettings.objects.select_related('business')
    serializer_class = ChunkingSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin]
    #permission_classes = [AllowAny]  # Anula la configuración global
    #authentication_classes = []  # Esto desactiva JWT para esta vista

    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['business', 'entity_type']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ChunkingSettings.objects.none()
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
                'entity_type',
                openapi.IN_QUERY,
                description="Tipo de entidad (document, product_service_item, message, review, other)",
                type=openapi.TYPE_STRING,
                required=True
            )
        ],
        responses={
            200: ChunkingSettingsSerializer,
            400: "Parámetros business_id y entity_type requeridos",
            404: "Configuración no encontrada"
        }
    )
    @action(detail=False, methods=['get'])
  #  @authentication_classes([])  # Desactiva JWT para este endpoint
  #  @permission_classes([AllowAny])  # Permite acceso público
    def by_entity(self, request):
        business_id = request.query_params.get('business_id')
        entity_type = request.query_params.get('entity_type')
        
        if not business_id or not entity_type:
            return Response(
                {'error': 'Both business_id and entity_type parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            settings = ChunkingSettings.objects.get(
                business_id=business_id,
                entity_type=entity_type
            )
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        except ChunkingSettings.DoesNotExist:
            return Response(
                {'error': 'Chunking settings not found for this business and entity type'},
                status=status.HTTP_404_NOT_FOUND
            )
        












class ExternalAPIConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar configuraciones de APIs externas
    
    Swagger:
        - list: Obtiene todas las configuraciones
        - create: Crea nueva configuración
        - retrieve: Obtiene detalles de configuración
        - update: Actualiza configuración completa
        - partial_update: Actualiza campos específicos
        - destroy: Elimina configuración
    """
    queryset = ExternalAPIConfig.objects.all()
    serializer_class = ExternalAPIConfigSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

class APIRouteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar rutas del API Gateway
    
    Swagger:
        - list: Obtiene todas las rutas
        - create: Crea nueva ruta
        - retrieve: Obtiene detalles de ruta
        - update: Actualiza ruta completa
        - partial_update: Actualiza campos específicos
        - destroy: Elimina ruta
    """
    queryset = APIRoute.objects.all()
    serializer_class = APIRouteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination





class GatewayView(APIView):
    """
    API Gateway Endpoint
    """
    renderer_classes = [JSONRenderer]
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.gateway_service = GatewayService()

    def get(self, request, path):
        return self._handle_request(request, path)

    def post(self, request, path):
        return self._handle_request(request, path)

    def put(self, request, path):
        return self._handle_request(request, path)

    def patch(self, request, path):
        return self._handle_request(request, path)

    def delete(self, request, path):
        return self._handle_request(request, path)

    def _handle_request(self, request, path):
        try:
            # Normalize path (ensure consistent trailing slash)
            normalized_path = path.rstrip('/') + '/'
            
            # Debug logging
            print(f"Processing request for path: {normalized_path}")
            
            # Get matching route
            route = APIRoute.objects.get(
                path=normalized_path,
                method=request.method,
                is_active=True
            )
            
            # Forward request
            result = self.gateway_service.forward_request(
                api_config=route.config,
                route=route,
                request=request
            )
            
            # Return response with explicit content type
            return Response(
                result,
                status=status.HTTP_200_OK,
                content_type='application/json'
            )
            
        except APIRoute.DoesNotExist:
            return Response(
                {'detail': 'Endpoint not found'},
                status=status.HTTP_404_NOT_FOUND,
                content_type='application/json'
            )
        except Exception as e:
            print(f"Error in gateway: {str(e)}")
            return Response(
                {'detail': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content_type='application/json'
            )
        

# Añadir al final de business/views.py





class DocumentViewSet(viewsets.ModelViewSet):
    """
    API para gestión de documentos con almacenamiento en S3.
    Incluye manejo de metadatos JSON y generación de URLs firmadas.
    """
    queryset = Document.objects.select_related('business')
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser]
    pagination_class = StandardResultsSetPagination

    @swagger_auto_schema(
        operation_description="""
        Sube un nuevo documento al sistema.
        
        - Formatos soportados: PDF, DOCX, XLSX, TXT
        - Tamaño máximo: 50MB
        - Se genera hash SHA-256 para evitar duplicados
        """,
        manual_parameters=[
            openapi.Parameter(
                'file',
                openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description="Archivo a subir"
            ),
            openapi.Parameter(
                'business_id',
                openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                format='uuid',
                required=True,
                description="ID del negocio propietario"
            ),
            openapi.Parameter(
                'metadata',
                openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=False,
                description="Metadatos en formato JSON string"
            )
        ],
        responses={
            201: DocumentSerializer,
            400: "Datos de entrada inválidos",
            500: "Error en el servidor"
        }
    )
    def create(self, request, *args, **kwargs):
        # Procesar metadata como string JSON
        metadata_str = request.data.get('metadata', '{}')
        try:
            metadata = json.loads(metadata_str)
        except json.JSONDecodeError:
            metadata = {}

        # Preparar datos para el serializer
        data = request.data.copy()
        data['metadata'] = metadata
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        try:
            storage_service = S3StorageService()
            file = request.FILES['file']
            business_id = serializer.validated_data['business_id']
            
            # Subir a S3 y crear registro
            s3_path, file_hash = storage_service.upload_file(file, file.name, business_id)
            document = Document.objects.create(
                business_id=business_id,
                name=file.name,
                type=file.name.split('.')[-1].lower(),
                file_path=s3_path,
                file_hash=file_hash,
                metadata=metadata
            )
            
            return Response(
                DocumentSerializer(document).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        operation_description="Lista documentos con filtrado opcional por negocio",
        manual_parameters=[
            openapi.Parameter(
                'business_id',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                format='uuid',
                description="Filtrar por ID de negocio"
            )
        ],
        responses={200: DocumentSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        business_id = request.query_params.get('business_id')
        if business_id:
            self.queryset = self.queryset.filter(business_id=business_id)
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Obtiene URL firmada para descargar el documento",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'download_url': openapi.Schema(type=openapi.TYPE_STRING),
                    'expires_in': openapi.Schema(type=openapi.TYPE_INTEGER)
                }
            ),
            404: "Documento no encontrado"
        }
    )
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        document = self.get_object()
        storage_service = S3StorageService()
        
        try:
            download_url = storage_service.get_file_url(document.file_path)
            return Response({
                'download_url': download_url,
                'expires_in': 3600  # 1 hora de validez
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @swagger_auto_schema(
        method='get',
        operation_description="Lista documentos de un negocio específico",
        manual_parameters=[
            openapi.Parameter(
                'business_id',
                openapi.IN_PATH,
                type=openapi.TYPE_STRING,
                format='uuid',
                required=True,
                description="ID del negocio"
            )
        ],
        responses={200: DocumentSerializer(many=True)}
    )
    @action(detail=False, url_path='by-business/(?P<business_id>[^/.]+)', methods=['get'])
    def by_business(self, request, business_id=None):
        queryset = self.queryset.filter(business_id=business_id)
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


    @swagger_auto_schema(
        operation_description="""
        Elimina completamente un documento:
        1. Elimina el archivo físico del almacenamiento S3
        2. Elimina el registro de la base de datos
        
        **Importante**: Esta acción no se puede deshacer.
        """,
        responses={
            204: "Documento eliminado exitosamente",
            404: "Documento no encontrado",
            500: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'error': openapi.Schema(type=openapi.TYPE_STRING)
                }
            )
        }
    )
    def destroy(self, request, *args, **kwargs):
        """
        Elimina un documento tanto de la base de datos como de S3
        ---
        responses:
            204:
                description: Documento eliminado exitosamente
            404:
                description: Documento no encontrado
            500:
                description: Error al eliminar el archivo de S3
        """
        document = self.get_object()
        storage_service = S3StorageService()
        
        try:
            # Intentar eliminar de S3 primero
            try:
                # Primero eliminar el archivo de S3
                storage_service.delete_file(document.file_path)
            except Exception as s3_error:
                # Si falla S3 pero queremos continuar con la eliminación en DB:
                logger.error(f"Failed to delete from S3: {str(s3_error)}")                  
                # Opcional: puedes decidir no continuar si falla S3:
                # return Response(
                #     {'error': str(s3_error)},
                #     status=status.HTTP_500_INTERNAL_SERVER_ERROR
                # )
            
            # Luego eliminar el registro de la base de datos
            document.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar el documento: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ProductServiceItemViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna la lista de productos/servicios del negocio del usuario.

    create:
    Crea un nuevo producto/servicio.

    retrieve:
    Obtiene los detalles de un producto/servicio específico.

    update:
    Actualiza todos los campos de un producto/servicio.

    partial_update:
    Actualiza campos específicos de un producto/servicio.

    destroy:
    Elimina un producto/servicio.
    """
    queryset = ProductServiceItem.objects.select_related('business')
    serializer_class = ProductServiceItemSerializer
    permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ProductServiceItem.objects.none()
        
        queryset = super().get_queryset()
        if not self.request.user.is_superuser:
            queryset = queryset.filter(business=self.request.user.business)
        return queryset
    
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'category',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description='Filter by category'
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    

    @action(detail=False, methods=['get'], url_path='by-business/(?P<business_id>[^/.]+)')
    def by_business(self, request, business_id=None):
        """
        Lista todos los ítems de producto/servicio de un negocio específico.
        ---
        parameters:
            - name: business_id
              in: path
              description: ID del negocio
              required: true
              type: string
              format: uuid
        responses:
            200:
                description: Lista de ítems del negocio
                schema:
                    $ref: '#/definitions/ProductServiceItem'
            404:
                description: Negocio no encontrado
        """
        try:
            business = Business.objects.get(id=business_id)
            items = self.queryset.filter(business=business)
            page = self.paginate_queryset(items)
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        except Business.DoesNotExist:
            return Response(
                {'error': 'Business not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @swagger_auto_schema(
        method='get',
        manual_parameters=[
            openapi.Parameter(
                'business_id',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                format='uuid',
                description='Filter by business ID'
            ),
            openapi.Parameter(
                'category',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description='Filter by category'
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def filter_by_business(self, request):
        """
        Filtra ítems por negocio y categoría (opcional)
        """
        business_id = request.query_params.get('business_id')
        category = request.query_params.get('category')

        queryset = self.queryset
        if business_id:
            queryset = queryset.filter(business_id=business_id)
        if category:
            queryset = queryset.filter(category__iexact=category)
            
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    


# Añadir al final de business/views.py

class EmbeddingViewSet(viewsets.ModelViewSet):
    """
    list:
    Retorna los embeddings del negocio del usuario.

    create:
    Crea un nuevo embedding (requiere permisos de administrador o admin de negocio).

    retrieve:
    Obtiene los detalles de un embedding específico.

    update:
    Actualiza todos los campos de un embedding.

    partial_update:
    Actualiza campos específicos de un embedding.

    destroy:
    Elimina un embedding.
    """
    queryset = Embedding.objects.select_related('business')
#    serializer_class = EmbeddingSerializer
    #permission_classes = [IsAuthenticated, IsAdminUser | IsBusinessAdmin]
    permission_classes = [AllowAny]  # Anula la configuración global
    authentication_classes = []  # Esto desactiva JWT para esta vista

    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['source_type', 'business']
    
    def get_serializer_class(self):
        """Usa diferente serializer para creación vs otras operaciones"""
        if self.action == 'create':
            return EmbeddingCreateSerializer
        return EmbeddingSerializer
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Embedding.objects.none()
        
        queryset = super().get_queryset()
        if not self.request.user.is_superuser:
            queryset = queryset.filter(business=self.request.user.business)
        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'source_type',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Tipo de fuente (document, product, intent_example, message, other)",
                enum=[choice[0] for choice in Embedding.SOURCE_TYPES]
            ),
            openapi.Parameter(
                'source_id',
                openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                format='uuid',
                description="ID de la fuente (document_id, product_id, etc.)"
            )
        ],
        responses={200: EmbeddingSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        source_type = request.query_params.get('source_type')
        source_id = request.query_params.get('source_id')
        
        queryset = self.filter_queryset(self.get_queryset())
        
        if source_type:
            queryset = queryset.filter(source_type=source_type)
        if source_id:
            queryset = queryset.filter(source_id=source_id)
            
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @swagger_auto_schema(
        operation_description="Busca embeddings similares usando cosine similarity con pgvector",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'vector': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_NUMBER),
                    description="Vector de consulta para búsqueda de similitud"
                ),
                'top_k': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Número de resultados a devolver (default: 5)"
                ),
                'min_similarity': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    description="Umbral mínimo de similitud (default: 0.7)"
                ),
                'business_id': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    format='uuid',
                    description="ID del negocio para filtrar los embeddings"
                )
            },
            required=['vector', 'business_id']
        ),
        responses={
            200: openapi.Response(
                description="Resultados de búsqueda con similitudes",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'results': openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    'id': openapi.Schema(type=openapi.TYPE_STRING, format='uuid'),
                                    'content': openapi.Schema(type=openapi.TYPE_STRING),
                                    'metadata': openapi.Schema(type=openapi.TYPE_OBJECT),
                                    'source_type': openapi.Schema(type=openapi.TYPE_STRING),
                                    'source_id': openapi.Schema(type=openapi.TYPE_STRING, format='uuid'),
                                    'chunk_index': openapi.Schema(type=openapi.TYPE_INTEGER),
                                    'similarity': openapi.Schema(type=openapi.TYPE_NUMBER, format='float')
                                    # Agrega aquí otros campos del embedding que quieras incluir
                                }
                            )
                        ),
                        'count': openapi.Schema(type=openapi.TYPE_INTEGER)
                    }
                )
            ),
            400: "Vector inválido o parámetros incorrectos"
        }
    )
    @action(detail=False, methods=['post'])
    def search(self, request):
        """
        Busca embeddings similares usando cosine similarity.
        Devuelve los chunks con su porcentaje de similitud (sin incluir el vector).
        """
        vector = request.data.get('vector')
        top_k = int(request.data.get('top_k', 5))
        min_similarity = float(request.data.get('min_similarity', 0.7))
        business_id = request.data.get('business_id')
        
        # Validaciones
        if not vector or not isinstance(vector, list):
            return Response(
                {'error': 'Vector must be a list of numbers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not business_id:
            return Response(
                {'error': 'business_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:

            # Filtrar y calcular similitud
            queryset = Embedding.objects.filter(business_id=business_id).annotate(
                similarity=1 - Cast(CosineDistance('vector', vector), output_field=FloatField())
            ).filter(
                similarity__gte=min_similarity
            ).order_by(
                '-similarity'
            )[:top_k]
            
            # Preparar resultados sin el campo vector
            results = []
            for embedding in queryset:
                result = {
                    'id': str(embedding.id),
                    'content': embedding.content,
                    'metadata': embedding.metadata,
                    'source_type': embedding.source_type,
                    'source_id': str(embedding.source_id),
                    'chunk_index': embedding.chunk_index,
                    'similarity': float(embedding.similarity),
                   # 'business': {  # Diccionario con los campos relevantes
                   #     'id': str(embedding.business.id),
                   #     'name': embedding.business.name
                        # Agrega otros campos que necesites
                   # },
                    'business_id': str(embedding.business.id),
                    'created_at': embedding.created_at,
                    'updated_at': embedding.updated_at
                    # Agrega aquí otros campos que necesites
                }
                results.append(result)
            
            return Response({
                'results': results,
                'count': len(results)
            })
            
        except Exception as e:
            logger.error(f"Error in semantic search: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @swagger_auto_schema(
        operation_description="Obtiene embeddings por source_type y source_id",
        manual_parameters=[
            openapi.Parameter(
                'source_type',
                openapi.IN_PATH,
                type=openapi.TYPE_STRING,
                enum=[choice[0] for choice in Embedding.SOURCE_TYPES],
                required=True,
                description="Tipo de fuente"
            ),
            openapi.Parameter(
                'source_id',
                openapi.IN_PATH,
                type=openapi.TYPE_STRING,
                format='uuid',
                required=True,
                description="ID de la fuente"
            )
        ],
        responses={
            200: EmbeddingSerializer(many=True),
            404: "No se encontraron embeddings para esta fuente"
        }
    )

    @action(detail=False, methods=['get'], url_path='by-source/(?P<source_type>[^/.]+)/(?P<source_id>[^/.]+)')
    def by_source(self, request, source_type=None, source_id=None):
        """
        Lista todos los embeddings de una fuente específica (document, product, etc.)
        """
        # Validar source_type
        valid_types = [choice[0] for choice in Embedding.SOURCE_TYPES]
        if source_type not in valid_types:
            return Response(
                {'error': f'Invalid source_type. Valid types are: {", ".join(valid_types)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            source_type=source_type,
            source_id=source_id
        ).order_by('chunk_index')
        
        if not queryset.exists():
            return Response(
                {'error': 'No embeddings found for this source'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    

# Añadir este método a la clase EmbeddingViewSet en business/views.py

@swagger_auto_schema(
    method='get',
    operation_description="Lista todos los embeddings de un negocio específico",
    manual_parameters=[
        openapi.Parameter(
            'business_id',
            openapi.IN_PATH,
            type=openapi.TYPE_STRING,
            format='uuid',
            required=True,
            description="ID del negocio"
        ),
        openapi.Parameter(
            'source_type',
            openapi.IN_QUERY,
            type=openapi.TYPE_STRING,
            description="Filtrar por tipo de fuente (document, product, etc.)",
            enum=[choice[0] for choice in Embedding.SOURCE_TYPES]
        ),
        openapi.Parameter(
            'chunk_index',
            openapi.IN_QUERY,
            type=openapi.TYPE_INTEGER,
            description="Filtrar por índice de chunk específico"
        )
    ],
    responses={
        200: EmbeddingSerializer(many=True),
        404: "Negocio no encontrado"
    }
)
@action(detail=False, methods=['get'], url_path='by-business/(?P<business_id>[^/.]+)')
def by_business(self, request, business_id=None):
    """
    Lista todos los embeddings de un negocio específico, con filtros opcionales.
    ---
    Ejemplos:
    - /api/embeddings/by-business/3fa85f64-5717-4562-b3fc-2c963f66afa6/
    - /api/embeddings/by-business/3fa85f64-5717-4562-b3fc-2c963f66afa6/?source_type=document
    - /api/embeddings/by-business/3fa85f64-5717-4562-b3fc-2c963f66afa6/?chunk_index=0
    """
    try:
        # Verificar que el negocio existe
        business = Business.objects.get(id=business_id)
    except Business.DoesNotExist:
        return Response(
            {'error': 'Business not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Construir el queryset base
    queryset = self.get_queryset().filter(business=business)
    
    # Aplicar filtros opcionales
    source_type = request.query_params.get('source_type')
    if source_type:
        queryset = queryset.filter(source_type=source_type)
    
    chunk_index = request.query_params.get('chunk_index')
    if chunk_index:
        queryset = queryset.filter(chunk_index=chunk_index)
    
    # Ordenar por fecha de creación descendente
    queryset = queryset.order_by('-created_at')
    
    # Paginar los resultados
    page = self.paginate_queryset(queryset)
    if page is not None:
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    serializer = self.get_serializer(queryset, many=True)
    return Response(serializer.data)


class TaskStatusView(APIView):
    permission_classes = [AllowAny]  # Anula la configuración global
    authentication_classes = []  # Esto desactiva JWT para esta vista
    def get(self, request, task_id):
        # Convierte task_id a string (si es UUID u otro tipo)
        task_id_str = str(task_id)
        task_result = AsyncResult(task_id_str)
        return Response({
            'ready': task_result.ready(),
            'successful': task_result.successful(),
            'result': task_result.result if task_result.ready() else None,
            'status': task_result.status
        })


