# business/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Business, BusinessUser, Role, UserActivityLog, BotSettings, BotTemplate, ChunkingSettings, ExternalAPIConfig, APIRoute, Document, ProductServiceItem, Embedding

class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_email', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'contact_email', 'contact_phone')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('name', 'is_active')}),
        ('Información de contacto', {
            'fields': ('contact_email', 'contact_phone', 'address')
        }),
        ('Descripción', {
            'fields': ('description',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    list_editable = ('is_active',)
    filter_horizontal = ()
    fieldsets = (
        (None, {'fields': ('name', 'is_active')}),
        ('Descripción', {
            'fields': ('description',)
        }),
        ('Permisos', {
            'fields': ('permissions',),
            'classes': ('collapse',)
        }),
    )

class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'ip_address', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'action', 'ip_address')
    readonly_fields = ('created_at', 'user', 'action', 'details', 'ip_address')
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False  # Los logs no se deben crear manualmente

    def has_change_permission(self, request, obj=None):
        return False  # Los logs no se deben modificar

class BusinessUserAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'business', 'role', 'is_active')
    list_filter = ('is_active', 'business', 'role')
    search_fields = ('email', 'full_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Business Info', {'fields': ('business', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2'),
        }),
    )

class BotSettingsAdmin(admin.ModelAdmin):
    list_display = ('business', 'llm_model_name', 'updated_at')
    list_filter = ('llm_model_name', 'embedding_model_name')
    search_fields = ('business__name',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('business', 'llm_model_name', 'embedding_model_name', 'embedding_dim')
        }),
        ('Modelos', {
            'fields': ('sentiment_model_name', 'intent_model_name')
        }),
        ('Configuración de búsqueda', {
            'fields': ('search_top_k', 'search_min_similarity')
        }),
        ('Configuración de generación', {
            'fields': ('generation_temperature', 'generation_top_p', 
                      'generation_top_k', 'generation_frequency_penalty',
                      'generation_presence_penalty')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class BotTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'type', 'updated_at')
    list_filter = ('type', 'business')
    search_fields = ('name', 'business__name', 'prompt_template')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('business', 'name', 'type', 'is_active')
        }),
        ('Plantilla', {
            'fields': ('prompt_template',)
        }),
        ('Configuraciones opcionales', {
            'fields': ('temperature', 'top_p', 'top_k',
                      'frequency_penalty', 'presence_penalty'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

class ChunkingSettingsAdmin(admin.ModelAdmin):
    list_display = ('business', 'entity_type', 'chunk_size', 'chunk_overlap', 'updated_at')
    list_filter = ('entity_type',)
    search_fields = ('business__name',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('business', 'entity_type', 'is_active')
        }),
        ('Configuración de Chunking', {
            'fields': ('chunk_size', 'chunk_overlap')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )



# Añadir al final de business/admin.py

class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'type', 'created_at')
    list_filter = ('type', 'business', 'created_at')
    search_fields = ('name', 'business__name', 'file_hash')
    readonly_fields = ('file_hash', 'created_at', 'updated_at', 'file_path')
    fieldsets = (
        (None, {
            'fields': ('business', 'name', 'type', 'is_active')
        }),
        ('Archivo', {
            'fields': ('file_path', 'file_hash')
        }),
        ('Contenido', {
            'fields': ('content_text',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # Deshabilitar la creación desde el admin, deben usarse los endpoints API
        return False

    def has_change_permission(self, request, obj=None):
        # Permitir solo cambios en metadatos, no en el archivo
        return True

    def has_delete_permission(self, request, obj=None):
        # Permitir eliminación solo a superusuarios
        return request.user.is_superuser

class ProductServiceItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'category', 'price', 'created_at')
    list_filter = ('category', 'business', 'created_at')
    search_fields = ('name', 'business__name', 'description')
    list_editable = ('price',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('business', 'name', 'is_active')
        }),
        ('Descripción', {
            'fields': ('description', 'category')
        }),
        ('Precio e Imagen', {
            'fields': ('price', 'image_url')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(business=request.user.business)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "business" and not request.user.is_superuser:
            kwargs["queryset"] = Business.objects.filter(id=request.user.business.id)
            kwargs["initial"] = request.user.business
        return super().formfield_for_foreignkey(db_field, request, **kwargs)



# Añadir al final de business/admin.py

class ExternalAPIConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_url', 'auth_type', 'is_active')
    list_filter = ('auth_type', 'is_active')
    search_fields = ('name', 'base_url')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'base_url', 'is_active')
        }),
        ('Autenticación', {
            'fields': ('auth_type', 'api_key')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        # Hacer que api_key sea de solo lectura en la edición
        if obj:
            return self.readonly_fields + ('api_key',)
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        # Si es una creación y no se proporcionó api_key, limpiar el campo
        if not change and not form.cleaned_data.get('api_key'):
            obj.api_key = None
        super().save_model(request, obj, form, change)

class APIRouteAdmin(admin.ModelAdmin):
    list_display = ('path', 'external_path', 'method', 'config', 'requires_auth', 'is_active')
    list_filter = ('method', 'requires_auth', 'is_active', 'config')
    search_fields = ('path', 'external_path')
    list_editable = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('config', 'is_active')
        }),
        ('Rutas', {
            'fields': ('path', 'external_path', 'method')
        }),
        ('Autenticación', {
            'fields': ('requires_auth',)
        }),
        ('Transformaciones', {
            'fields': ('request_transformation', 'response_transformation'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "config":
            kwargs["queryset"] = ExternalAPIConfig.objects.filter(is_active=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# Añadir al final de business/admin.py

class EmbeddingAdmin(admin.ModelAdmin):
    list_display = ('id', 'business', 'source_type', 'source_id', 'chunk_index', 'created_at')
    list_filter = ('source_type', 'business', 'created_at')
    search_fields = ('content', 'source_id', 'business__name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    list_select_related = ('business',)
    
    fieldsets = (
        (None, {
            'fields': ('id', 'business', 'created_at', 'updated_at')
        }),
        ('Source Information', {
            'fields': ('source_type', 'source_id', 'chunk_index')
        }),
        ('Content', {
            'fields': ('content', 'vector', 'metadata'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # Los embeddings deberían crearse a través de la API, no manualmente
        return False

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(business=request.user.business)


# Registrar el modelo
admin.site.register(Embedding, EmbeddingAdmin)

# Registrar los modelos
admin.site.register(ExternalAPIConfig, ExternalAPIConfigAdmin)
admin.site.register(APIRoute, APIRouteAdmin)


# Registrar los nuevos modelos
admin.site.register(Document, DocumentAdmin)
admin.site.register(ProductServiceItem, ProductServiceItemAdmin)

# Registro de modelos
admin.site.register(Business, BusinessAdmin)
admin.site.register(Role, RoleAdmin)
admin.site.register(BusinessUser, BusinessUserAdmin)
admin.site.register(UserActivityLog, UserActivityLogAdmin)
admin.site.register(BotSettings, BotSettingsAdmin)
admin.site.register(BotTemplate, BotTemplateAdmin)
admin.site.register(ChunkingSettings, ChunkingSettingsAdmin)