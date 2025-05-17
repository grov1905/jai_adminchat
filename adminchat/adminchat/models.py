# business/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from adminchat.managers import BusinessUserManager
from django.conf import settings
from pgvector.django import VectorField  # Importa VectorField

class Role(models.Model):
    """Modelo para roles de usuario"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)  # Lista de permisos específicos
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'chat_role'  # Prefijo 'chat_' para tablas role

    def __str__(self):
        return self.name

class Business(models.Model):
    """Modelo para negocios/clientes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Información adicional del negocio
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'chat_business'  # Prefijo 'chat_' para tablas business
        verbose_name_plural = "Businesses"
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class BusinessUser(AbstractBaseUser, PermissionsMixin):
    """Modelo personalizado para usuarios del sistema"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business, 
        on_delete=models.CASCADE, 
        related_name='users',
        null=True,  # Permitir usuarios sin negocio (superusuarios)
        blank=True
    )
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Campos de control
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Campos adicionales de perfil
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True
    )
    
    objects = BusinessUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'chat_businessuser'  # Prefijo 'chat_' para tablas businessuser

    def __str__(self):
        return f"{self.full_name} ({self.email})"

class UserActivityLog(models.Model):
    """Registro de actividades de usuarios"""
    user = models.ForeignKey(BusinessUser, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_useractivitylog'  # Prefijo 'chat_' para tablas useractivitylog
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.action}"
    
# Añadir al final del archivo business/models.py

class BotSettings(models.Model):
    """Configuración general del bot por negocio"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.OneToOneField(
        Business,
        on_delete=models.CASCADE,
        related_name='bot_settings'
    )
    llm_model_name = models.CharField(max_length=100, default='gpt-4')
    embedding_model_name = models.CharField(max_length=100, default='text-embedding-ada-002')
    embedding_dim = models.CharField(max_length=100, blank=True, null=True)  # Nuevo campo agregado
    sentiment_model_name = models.CharField(max_length=100, blank=True, null=True)
    intent_model_name = models.CharField(max_length=100, blank=True, null=True)
    search_top_k = models.IntegerField(default=5)
    search_min_similarity = models.FloatField(default=0.75)
    generation_temperature = models.FloatField(default=0.7)
    generation_top_p = models.FloatField(default=0.9)
    generation_top_k = models.IntegerField(default=50)
    generation_frequency_penalty = models.FloatField(default=0.0)
    generation_presence_penalty = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_botsettings'
        verbose_name = 'Bot Settings'
        verbose_name_plural = 'Bot Settings'
        ordering = ['-created_at']  # Ordenar por fecha descendente


    def __str__(self):
        return f"Bot Settings for {self.business.name}"

class BotTemplate(models.Model):
    """Plantillas de prompts para diferentes escenarios del bot"""
    TEMPLATE_TYPES = [
        ('greeting', 'Saludo'),
        ('farewell', 'Despedida'),
        ('sales', 'Venta'),
        ('support', 'Soporte'),
        ('other', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='bot_templates'
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TEMPLATE_TYPES)
    prompt_template = models.TextField()
    temperature = models.FloatField(blank=True, null=True)
    top_p = models.FloatField(blank=True, null=True)
    top_k = models.IntegerField(blank=True, null=True)
    frequency_penalty = models.FloatField(blank=True, null=True)
    presence_penalty = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_bottemplate'
        verbose_name = 'Bot Template'
        verbose_name_plural = 'Bot Templates'
        unique_together = ('business', 'name')  # No puede haber dos templates con el mismo nombre por negocio
        ordering = ['-created_at']  # Ordenar por fecha de creación descendente

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.business.name}"
    

    # Añadir al final de business/models.py

class ChunkingSettings(models.Model):
    """Configuración de chunking para diferentes tipos de entidades"""
    ENTITY_TYPES = [
        ('document', 'Documento'),
        ('product_service_item', 'Ítem de Producto/Servicio'),
        ('message', 'Mensaje'),
        ('review', 'Reseña'),
        ('other', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='chunking_settings'
    )
    entity_type = models.CharField(
        max_length=50,
        choices=ENTITY_TYPES,
        default='document'
    )
    chunk_size = models.IntegerField(default=1000)
    chunk_overlap = models.IntegerField(default=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_chunkingsettings'
        verbose_name = 'Chunking Settings'
        verbose_name_plural = 'Chunking Settings'
        unique_together = ('business', 'entity_type')  # No puede haber dos configs para el mismo tipo en un negocio
        ordering = ['-created_at']  # Ordenar por fecha de creación descendente

    def __str__(self):
        return f"Chunking Settings for {self.business.name} - {self.get_entity_type_display()}"
    
    






# Añadir al final de business/models.py
class ExternalAPIConfig(models.Model):
    """
    Configuración de APIs externas para el Gateway
    
    Attributes:
        name: Nombre identificador del servicio (ej: JaiEmbedder)
        base_url: URL base del servicio (ej: http://jai_embedder:8001/api/v1/)
        auth_type: Tipo de autenticación (api_key, jwt, basic, none)
        api_key: Credenciales opcionales (almacenadas cifradas en producción)
        is_active: Indica si la configuración está activa
    """
    AUTH_CHOICES = [
        ('api_key', 'API Key'),
        ('jwt', 'JWT'),
        ('basic', 'Basic Auth'),
        ('none', 'None')
    ]
    
    name = models.CharField(max_length=100, unique=True)
    base_url = models.URLField()
    auth_type = models.CharField(max_length=20, choices=AUTH_CHOICES, default='none')
    api_key = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
         ordering = ['name']

    def __str__(self):
        return f"{self.name} ({'Active' if self.is_active else 'Inactive'})"

class APIRoute(models.Model):
    """
    Ruta del API Gateway que mapea a endpoints externos
    
    Attributes:
        config: Relación con ExternalAPIConfig
        path: Ruta en el gateway (ej: documents/<uuid:document_id>)
        external_path: Ruta real en el API externo (ej: documents/{document_id})
        method: Método HTTP (GET, POST, etc.)
        requires_auth: Si requiere autenticación JWT del usuario
        request_transformation: Mapeo de campos para el request
        response_transformation: Mapeo de campos para la respuesta
        is_active: Indica si la ruta está activa
    """
    METHOD_CHOICES = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE')
    ]
    
    config = models.ForeignKey(ExternalAPIConfig, on_delete=models.CASCADE, related_name='routes')
    path = models.CharField(max_length=255)
    external_path = models.CharField(max_length=255)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    requires_auth = models.BooleanField(default=True)
    request_transformation = models.JSONField(null=True, blank=True)
    response_transformation = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('path', 'method')
        verbose_name = 'API Route'
        verbose_name_plural = 'API Routes'
        ordering = ['path', 'method']

    def __str__(self):
        return f"{self.method} {self.path} -> {self.external_path}"
    


    # Añadir al final de business/models.py

class Document(models.Model):
    """Modelo para documentos subidos por negocios"""
    DOCUMENT_TYPES = [
        ('pdf', 'PDF'),
        ('docx', 'Word Document'),
        ('xlsx', 'Excel Spreadsheet'),
        ('csv', 'CSV File'),
        ('txt', 'Plain Text'),
        ('pptx', 'PowerPoint'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=DOCUMENT_TYPES)
    file_path = models.CharField(max_length=512)
    file_hash = models.CharField(max_length=64, unique=True)
    content_text = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_document'
        ordering = ['-created_at']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.business.name}"

class ProductServiceItem(models.Model):
    """Modelo para productos o servicios ofrecidos por negocios"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='product_service_items'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image_url = models.URLField(blank=True, null=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_productserviceitem'
        ordering = ['-created_at']
        verbose_name = 'Product/Service Item'
        verbose_name_plural = 'Product/Service Items'

    def __str__(self):
        return f"{self.name} - {self.business.name}"
    


class Embedding(models.Model):
    """Modelo para almacenar embeddings vectorizados de diferentes fuentes"""
    SOURCE_TYPES = [
        ('document', 'Documento'),
        ('product', 'Producto/Servicio'),
        ('intent_example', 'Ejemplo de Intención'),
        ('message', 'Mensaje'),
        ('other', 'Otro'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='embeddings'
    )
    vector = VectorField(dimensions=1024)  # Almacenaremos el vector como JSON (luego podemos migrar a pgvector)
    content = models.TextField()
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    source_id = models.UUIDField()
    chunk_index = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_embedding'
        indexes = [
            models.Index(fields=['business', 'source_type', 'source_id']),
            models.Index(fields=['source_type', 'source_id']),
        ]
        ordering = ['-created_at']
        verbose_name = 'Embedding'
        verbose_name_plural = 'Embeddings'

    def __str__(self):
        return f"Embedding for {self.get_source_type_display()} ({self.source_id}) - {self.business.name}"

    def save(self, *args, **kwargs):
        """Actualiza automáticamente el campo updated_at"""
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)