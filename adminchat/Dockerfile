FROM python:3.11-slim-bullseye

# Establecer variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PIP_DISABLE_PIP_VERSION_CHECK 1

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Crear y configurar directorio de trabajo
WORKDIR /app

# Instalar dependencias de Python primero (para caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copiar el proyecto
COPY . .

# Crea solo el directorio para static files (sin collectstatic)
RUN mkdir -p /app/staticfiles

# Puerto expuesto
EXPOSE 8000

# Comando de inicio modificado
CMD bash -c "python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 --workers 4 adminchat.wsgi:application"