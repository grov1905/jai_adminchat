from django.core.management.base import BaseCommand
from django.conf import settings
from adminchat.models import BusinessUser, Role
import os

class Command(BaseCommand):
    help = "Crea el superusuario y rol predeterminado"

    def handle(self, *args, **options):
        admin_email = os.getenv('DJANGO_ADMIN_EMAIL', 'grov1905@gmail.com')
        admin_password = os.getenv('DJANGO_ADMIN_PASSWORD', 'admin123')
        admin_name = os.getenv('DJANGO_ADMIN_NAME', 'Administrador Principal')

        self.stdout.write(f"Verificando existencia de superusuario {admin_email}...")

        admin_role, _ = Role.objects.get_or_create(
            name='Administrador',
            defaults={
                'description': 'Rol con acceso completo al sistema',
                'permissions': ['*'],
                'is_active': True
            }
        )

        if not BusinessUser.objects.filter(email=admin_email).exists():
            BusinessUser.objects.create_superuser(
                email=admin_email,
                full_name=admin_name,
                password=admin_password,
                role=admin_role
            )
            self.stdout.write(self.style.SUCCESS("Superusuario creado con éxito."))
        else:
            self.stdout.write(self.style.WARNING("Ya existe un superusuario con ese email."))




#########  python manage.py create_default_admin