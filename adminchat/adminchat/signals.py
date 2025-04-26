# business/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.conf import settings
import os
from .models import Role

@receiver(post_migrate)
def create_superuser_and_role(sender, **kwargs):
    if sender.name == 'adminchat':
        from .models import BusinessUser  # Import aquí para evitar circular imports
        
        # Configuración desde variables de entorno
        admin_email = os.getenv('DJANGO_ADMIN_EMAIL', 'grov1905@gmail.com')
        admin_password = os.getenv('DJANGO_ADMIN_PASSWORD', 'admin123')
        admin_name = os.getenv('DJANGO_ADMIN_NAME', 'Administrador Principal')

        # Crear rol de administrador
        admin_role, _ = Role.objects.get_or_create(
            name='Administrador',
            defaults={
                'description': 'Rol con acceso completo al sistema',
                'permissions': ['*'],
                'is_active': True
            }
        )

        # Crear superusuario usando tu BusinessUserManager
        if not BusinessUser.objects.filter(email=admin_email).exists():
            BusinessUser.objects.create_superuser(
                email=admin_email,
                full_name=admin_name,
                password=admin_password,
                role=admin_role  # Este campo adicional se maneja en **extra_fields
            )