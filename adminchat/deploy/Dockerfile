FROM nginx:alpine

# 1. Eliminar configuración default
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copiar configuración personalizada
COPY adminchat/deploy/nginx.conf /etc/nginx/conf.d

# Copiar archivos estáticos (desde Django)
# 3. Crear directorio para static files y copiarlos
RUN mkdir -p /app/staticfiles
COPY ./adminchat/staticfiles /app/staticfiles  

# Puerto expuesto (Railway inyectará $PORT)
# 4. Puerto dinámico para Railway
EXPOSE $PORT

# Nginx ya corre en foreground por defecto en la imagen oficial
# 5. Comando de inicio (no necesario en Alpine, pero lo dejamos explícito)
CMD ["nginx", "-g", "daemon off;"]