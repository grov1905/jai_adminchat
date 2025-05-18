# business/apps.py
from django.apps import AppConfig

class BusinessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'adminchat'

    def ready(self):
        # Importa y registra las señales
        from . import signals