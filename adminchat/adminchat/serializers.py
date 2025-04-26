# business/serializers.py
from rest_framework import serializers
from .models import Business, BusinessUser, Role, UserActivityLog
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from .models import BotSettings, BotTemplate    


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
        
        # Validar unicidad del nombre por negocio
        name = data.get('name')
        if name and 'business_id' in data:
            if BotTemplate.objects.filter(business_id=business_id, name=name).exists():
                raise serializers.ValidationError({'name': 'A template with this name already exists for this business'})
        
        return data