# adminchat/serializers.py
from rest_framework import serializers
from .models import Business, BusinessUser, Role, UserActivityLog
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from .models import BotSettings, BotTemplate, ChunkingSettings, ExternalAPIConfig, APIRoute, Document, ProductServiceItem, Embedding
import json
from django.db import transaction
import logging
from .tasks import create_embeddings_task

logger = logging.getLogger(__name__)


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class BusinessUserSerializer(serializers.ModelSerializer):
    business = BusinessSerializer(read_only=True)
    business_id = serializers.UUIDField(write_only=True, required=False)
    role = RoleSerializer(read_only=True)
    role_id = serializers.UUIDField(write_only=True, required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        min_length=8,
        error_messages={
            'min_length': 'La contraseña debe tener al menos 8 caracteres.'
        }
    )
    
    class Meta:
        model = BusinessUser
        fields = [
            'id', 'email', 'full_name', 'business', 'business_id', 
            'role', 'role_id', 'is_active', 'date_joined', 'last_login',
            'phone', 'profile_picture', 'password'  # Añadido password aquí
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'date_joined': {'read_only': True},
            'last_login': {'read_only': True},
        }

    def validate(self, data):
        # Validación adicional si es necesario
        if self.context['request'].method == 'POST' and not data.get('password'):
            raise serializers.ValidationError({
                'password': 'La contraseña es requerida para crear un usuario.'
            })
        return data

    def create(self, validated_data):
        # Extraer campos de relación
        business_id = validated_data.pop('business_id', None)
        role_id = validated_data.pop('role_id', None)
        password = validated_data.pop('password')
        
        # Crear usuario
        user = BusinessUser(**validated_data)
        user.set_password(password)  # Esto hashea y guarda el password
        
        # Asignar relaciones
        if business_id:
            user.business_id = business_id
        if role_id:
            user.role_id = role_id
        
        user.save()
        return user

    def update(self, instance, validated_data):
        # Manejar password por separado si se está actualizando
        password = validated_data.pop('password', None)
        
        # Actualizar otros campos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Si se proporcionó password, actualizarlo
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Agregar claims personalizados al token
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['is_superuser'] = user.is_superuser
        if user.role:
            token['role'] = user.role.name
        
        return token

class UserActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = UserActivityLog
        fields = '__all__'
        read_only_fields = ('created_at',)

class DashboardStatsSerializer(serializers.Serializer):
    business_stats = serializers.DictField()
    user_stats = serializers.DictField()
    last_updated = serializers.DateTimeField(default=timezone.now)


# Añadir al final del archivo business/serializers.py

class BotSettingsSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(write_only=True, required=True)
    business = BusinessSerializer(read_only=True)
    
    class Meta:
        model = BotSettings
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        business_id = validated_data.pop('business_id')
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
        
        # Validar que el negocio no tenga ya configuraciones
        if BotSettings.objects.filter(business=business).exists():
            raise serializers.ValidationError({'business_id': 'This business already has bot settings'})
            
        bot_settings = BotSettings.objects.create(business=business, **validated_data)
        return bot_settings

class BotTemplateSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(write_only=True, required=True)
    business = BusinessSerializer(read_only=True)
    
    class Meta:
        model = BotTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        # Validar que el business_id existe
        business_id = data.get('business_id')
        if business_id and not Business.objects.filter(id=business_id).exists():
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
        
        # Validar unicidad del nombre por negocio SOLO para creación (no para actualización)
        if self.instance is None:  # Solo en creación (POST)
            name = data.get('name')
            business_id = data.get('business_id')
            if name and business_id:
                if BotTemplate.objects.filter(business_id=business_id, name=name).exists():
                    raise serializers.ValidationError(
                        {'name': 'A template with this name already exists for this business'}
                    )        
        return data
    

    # Añadir al final de business/serializers.py

class ChunkingSettingsSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(write_only=True, required=True)
    business = BusinessSerializer(read_only=True)
    
    class Meta:
        model = ChunkingSettings
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        # Validar que el business_id existe
        business_id = data.get('business_id')
        if business_id and not Business.objects.filter(id=business_id).exists():
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
        
        # Validar unicidad del tipo por negocio
        entity_type = data.get('entity_type')
        if entity_type and 'business_id' in data:
            if ChunkingSettings.objects.filter(
                business_id=business_id, 
                entity_type=entity_type
            ).exists():
                raise serializers.ValidationError({
                    'entity_type': f'A chunking setting already exists for {entity_type} in this business'
                })
        
        # Validar valores de chunk_size y chunk_overlap
        chunk_size = data.get('chunk_size', self.instance.chunk_size if self.instance else 1000)
        chunk_overlap = data.get('chunk_overlap', self.instance.chunk_overlap if self.instance else 200)
        
        if chunk_size <= 0:
            raise serializers.ValidationError({'chunk_size': 'Chunk size must be greater than 0'})
        
        if chunk_overlap < 0:
            raise serializers.ValidationError({'chunk_overlap': 'Chunk overlap cannot be negative'})
        
        if chunk_overlap >= chunk_size:
            raise serializers.ValidationError({
                'chunk_overlap': 'Chunk overlap must be smaller than chunk size'
            })
        
        return data

    def create(self, validated_data):
        business_id = validated_data.pop('business_id')
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
            
        chunking_settings = ChunkingSettings.objects.create(business=business, **validated_data)
        return chunking_settings
    





# Serializers para ExternalAPIConfig y APIRoute
class ExternalAPIConfigSerializer(serializers.ModelSerializer):
    """
    Serializer para ExternalAPIConfig
    
    Swagger:
        - name: Nombre del servicio
        - base_url: URL base del API externo
        - auth_type: Tipo de autenticación requerida
        - is_active: Estado de la configuración
    """
    class Meta:
        model = ExternalAPIConfig
        fields = '__all__'
        extra_kwargs = {
            'api_key': {'write_only': True}
        }

class APIRouteSerializer(serializers.ModelSerializer):
    """
    Serializer para APIRoute
    
    Swagger:
        - path: Ruta en el gateway
        - external_path: Ruta destino
        - method: Método HTTP
        - request_transformation: Mapeo de campos para requests
        - response_transformation: Mapeo para respuestas
    """
    class Meta:
        model = APIRoute
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')








class DocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(
        write_only=True,
        required=True,
        style={'base_template': 'file_input.html'},
        help_text="Archivo a subir (PDF, DOCX, XLSX, TXT)"
    )
    business_id = serializers.UUIDField(
        write_only=True,
        required=True,
        help_text="ID del negocio propietario del documento"
    )
    business = BusinessSerializer(
        read_only=True,
        help_text="negocio propietario"
    )
    metadata = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Metadatos adicionales en formato JSON",
        style={'base_template': 'textarea.html'}
    )

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = (
            'id', 'type', 'file_path', 
            'file_hash', 'content_text',
            'created_at', 'updated_at', 'business'
        )

    def validate_metadata(self, value):
        """Valida que el campo metadata sea un JSON válido"""
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Metadata debe ser un JSON válido")
        return value

    def validate(self, data):
        """Validación general del documento"""
        file = data.get('file')
        if file:
            ext = file.name.split('.')[-1].lower()
            valid_extensions = [choice[0] for choice in Document.DOCUMENT_TYPES]
            if ext not in valid_extensions:
                raise serializers.ValidationError(
                    f"Tipo de archivo no soportado. Formatos válidos: {', '.join(valid_extensions)}"
                )
        return data

class ProductServiceItemSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(write_only=True, required=True)
    business = BusinessSerializer(read_only=True)
    
    class Meta:
        model = ProductServiceItem
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate(self, data):
        # Validar que el business_id existe
        business_id = data.get('business_id')
        if not Business.objects.filter(id=business_id).exists():
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
        
        return data
    




class EmbeddingCreateSerializer(serializers.ModelSerializer):
    """Serializer especializado para la creación de embeddings"""
    business_id = serializers.UUIDField(required=True)
    source_type = serializers.ChoiceField(choices=Embedding.SOURCE_TYPES, required=True)
    source_id = serializers.UUIDField(required=True)
    
    class Meta:
        model = Embedding
        fields = ['business_id', 'source_type', 'source_id']
        read_only_fields = ['id', 'created_at', 'updated_at', 'business', 'vector', 'content', 'metadata', 'chunk_index']
    
    def to_representation(self, instance):
        # Sobrescribe este método para manejar la representación de la respuesta
        if isinstance(instance, dict):
            return instance
        return super().to_representation(instance)

    def validate(self, data):
        """Validación extendida para los datos de entrada"""
        business_id = data.get('business_id')
        source_type = data.get('source_type')
        source_id = data.get('source_id')
        
        # Validar que el negocio existe
        if not Business.objects.filter(id=business_id).exists():
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
        
        # Validar que el source_id corresponde al source_type
        if source_type == 'document':
            if not Document.objects.filter(id=source_id, business_id=business_id).exists():
                raise serializers.ValidationError({
                    'source_id': 'Document not found for this business'
                })
        elif source_type == 'product':
            if not ProductServiceItem.objects.filter(id=source_id, business_id=business_id).exists():
                raise serializers.ValidationError({
                    'source_id': 'Product/Service not found for this business'
                })
        # Aquí puedes agregar más validaciones para otros source_types
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Crea los embeddings automáticamente según el source_type"""
        business_id = validated_data['business_id']
        source_type = validated_data['source_type']
        source_id = validated_data['source_id']
        
        task = create_embeddings_task.delay(
            business_id=business_id,
            source_type=source_type,
            source_id=source_id
        )

        # Devuelve directamente el diccionario sin pasar por la serialización del modelo
        return {
            'task_id': str(task.id),
            'status': 'Processing started',
            'monitor_url': f'/api/tasks/{task.id}/status/',
            'business_id': str(business_id),
            'source_type': source_type,
            'source_id': str(source_id)
        }


class EmbeddingSerializer(serializers.ModelSerializer):
    business_id = serializers.UUIDField(write_only=True, required=True)
    business = BusinessSerializer(read_only=True)
    
    class Meta:
        model = Embedding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'business')
    
    def validate(self, data):
        # Validar que el business_id existe
        business_id = data.get('business_id')
        if business_id and not Business.objects.filter(id=business_id).exists():
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
        
        # Validar source_type y source_id
        source_type = data.get('source_type')
        source_id = data.get('source_id')
        
        if source_type and source_id:
            # Verificar que el source_id corresponde a un objeto existente según el source_type
            model_map = {
                'document': Document,
                'product': ProductServiceItem,
                # Agregar otros mapeos cuando tengamos esos modelos
            }
            
            if source_type in model_map:
                model_class = model_map[source_type]
                if not model_class.objects.filter(id=source_id).exists():
                    raise serializers.ValidationError({
                        'source_id': f'No {source_type} found with this ID'
                    })
        
        # Validar que el vector es una lista de números
        vector = data.get('vector')
        if vector:
            if not isinstance(vector, list):
                raise serializers.ValidationError({'vector': 'Vector must be a list'})
            if not all(isinstance(x, (int, float)) for x in vector):
                raise serializers.ValidationError({'vector': 'All vector elements must be numbers'})
        
        return data
    
    def create(self, validated_data):
        business_id = validated_data.pop('business_id')
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            raise serializers.ValidationError({'business_id': 'Business does not exist'})
            
        embedding = Embedding.objects.create(business=business, **validated_data)
        return embedding