# business/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Business, BusinessUser, Role, UserActivityLog, BotSettings, BotTemplate

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
        ('Personal Info', {'fields': ('full_name')}),
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
            'fields': ('business', 'llm_model_name', 'embedding_model_name')
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

# Registro de modelos
admin.site.register(Business, BusinessAdmin)
admin.site.register(Role, RoleAdmin)
admin.site.register(BusinessUser, BusinessUserAdmin)
admin.site.register(UserActivityLog, UserActivityLogAdmin)
admin.site.register(BotSettings, BotSettingsAdmin)
admin.site.register(BotTemplate, BotTemplateAdmin)