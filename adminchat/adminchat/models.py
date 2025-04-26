# business/models.py
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from adminchat.managers import BusinessUserManager


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

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.business.name}"