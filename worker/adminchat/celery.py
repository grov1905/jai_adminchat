# adminchat/adminchat/celery.py
import os
from celery import Celery
from django.conf import settings

# Establece el módulo de configuración de Django por defecto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adminchat.settings')

app = Celery('adminchat')

# Usando una string significa que el worker no necesita serializar
# el objeto de configuración a procesos hijos.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carga los módulos de tasks de todas las aplicaciones Django registradas
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')