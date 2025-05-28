#worker/Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Instala dependencias
#desarrollo
#COPY ./adminchat/requirements.txt .
#produccion
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copia SOLO lo necesario (ajustado a tu estructura)
#desarrollo
#COPY ./adminchat/adminchat/ /app/adminchat/
#COPY ./adminchat/manage.py /app/
#produccion
COPY . .


# Variables de entorno esenciales (CORREGIDO)
ENV PYTHONPATH=/app  
ENV DJANGO_SETTINGS_MODULE=adminchat.settings

# Comando para ejecutar Celery (versión definitiva)
CMD ["celery", "-A", "adminchat.celery", "worker", "--loglevel=info"]

