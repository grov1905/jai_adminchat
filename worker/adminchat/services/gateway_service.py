# adminchat/services/gateway_service.py
import jwt
import time
from urllib.parse import urljoin, urlencode
from rest_framework.exceptions import APIException
from requests.auth import HTTPBasicAuth
from django.conf import settings
import requests
import json

class GatewayService:
    """
    Core service for handling external API requests through the gateway.
    
    Responsibilities:
    - Build complete external API URLs
    - Handle authentication with external services
    - Transform request/response data according to route configurations
    - Execute HTTP requests with proper error handling
    
    Usage Example:
    ```python
    service = GatewayService()
    result = service.forward_request(api_config, route, django_request)
    ```
    """
    
    def __init__(self):
        """Initialize the service with a persistent requests session"""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Django-API-Gateway/1.0',
            'Accept': 'application/json'
        })

    def _prepare_headers(self, api_config, request):
        """
        Prepare headers for the external API request
        
        Args:
            api_config (ExternalAPIConfig): Configuration for the external API
            request (HttpRequest): Original Django request object
            
        Returns:
            dict: Headers dictionary with:
                - Content-Type from original request
                - Authorization if configured
        """
        headers = {
            'Content-Type': request.content_type or 'application/json',
        }
        
        # Handle JWT auth
        if api_config.auth_type == 'jwt':
            token = jwt.encode(
                {
                    'user_id': str(request.user.id),
                    'exp': time.time() + 300
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            headers['Authorization'] = f'Bearer {token}'
            
        # Handle API Key auth    
        elif api_config.auth_type == 'api_key' and api_config.api_key:
            headers['Authorization'] = f'Bearer {api_config.api_key}'
            
        # Handle Basic Auth
        elif api_config.auth_type == 'basic' and api_config.api_key:
            headers['Authorization'] = HTTPBasicAuth(
                api_config.name, 
                api_config.api_key
            )(self.session)
            
        return headers

    def _build_url(self, api_config, route, request):
        """
        Construct the complete external API URL
        
        Args:
            api_config (ExternalAPIConfig): External API configuration
            route (APIRoute): Matched route configuration
            request (HttpRequest): Original Django request
            
        Returns:
            str: Complete URL including:
                - Base URL from config
                - Formatted external path
                - Query parameters from original request
        """
        # Format path with URL parameters
        formatted_path = route.external_path.format(**request.resolver_match.kwargs)
        
        # Join base URL with path
        base = api_config.base_url.rstrip('/') + '/'
        path = formatted_path.lstrip('/')
        url = urljoin(base, path)
        
        # Add query string if present
        if request.query_params:
            url = f"{url}?{urlencode(request.query_params.dict())}"
            
        return url

    def forward_request(self, api_config, route, request):
        try:
            # Construir URL (igual que antes)
            external_path = route.external_path.format(**request.resolver_match.kwargs)
            base_url = api_config.base_url.rstrip('/') + '/'
            url = urljoin(base_url, external_path.lstrip('/'))
            
            if request.query_params:
                url += '?' + urlencode(request.query_params.dict())
            
            print(f"1 Forwarding to: {url}")

            # Preparar headers
            headers = {
                'Content-Type': request.content_type or 'application/json',
                'Accept': 'application/json',
            }


            # Autenticación (igual que antes)
            if api_config.auth_type == 'api_key' and api_config.api_key:
                headers['Authorization'] = f'Bearer {api_config.api_key}'

            print(f"2 headers: {headers}")

            # Preparar datos para POST/PUT/PATCH
            data = None
            if request.method in ['POST', 'PUT', 'PATCH']:
                try:
                    print(f"3 request.body: {request.body}")
                    data = json.loads(request.body) if request.body else {}
                except json.JSONDecodeError:
                    data = request.POST.dict()
                
                if route.request_transformation:
                    data = self._transform_data(data, route.request_transformation)
            
            print(f"4 antes de la peticion metodo: {request.method} url: {url} y data: {data}")

            # Hacer la petición
            response = requests.request(
                method=request.method,
                url=url,
                headers=headers,
                json=data,
                timeout=30
            )
            
            # Procesar respuesta de manera más robusta
            try:
                response.raise_for_status()
                
                # Intentar decodificar como JSON solo si el content-type lo indica
                content_type = response.headers.get('Content-Type', '').lower()
                
                if 'application/json' in content_type:
                    response_data = response.json()
                    
                    if route.response_transformation:
                        response_data = self._transform_data(response_data, route.response_transformation)
                        
                    return response_data
                else:
                    # Si no es JSON, devolver el contenido tal cual
                    return {
                        'content': response.content.decode('latin-1') if response.content else None,
                        'content_type': content_type,
                        'status_code': response.status_code
                    }
                    
            except json.JSONDecodeError:
                # Si falla el decode JSON pero el content-type es JSON
                return {
                    'raw_content': response.content.decode('latin-1'),
                    'content_type': content_type,
                    'warning': 'El contenido no es JSON válido'
                }

        except requests.exceptions.RequestException as e:
            error_detail = str(e)
            if hasattr(e, 'response') and e.response:
                try:
                    error_detail = e.response.json()
                except ValueError:
                    # Intentar decodificar con latin-1 como fallback
                    try:
                        error_detail = e.response.content.decode('latin-1')
                    except:
                        error_detail = str(e.response.content)
                        
            raise APIException(detail=error_detail, code=getattr(e.response, 'status_code', 500))