import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Key en minúsculas para compatibilidad
    config.headers['authorization'] = `Bearer ${token}`;
    
    // Debug: Verifica los headers antes de enviar
    console.log('Headers configurados:', config.headers);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuesta mejorado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401) {
      console.error('Error 401 Detalles:', {
        url: originalRequest.url,
        headers: originalRequest.headers,
        response: error.response.data
      });
      
      // Redirige a login si el token es inválido
      window.location.href = '/login?session_expired=1';
    }
    
    return Promise.reject(error);
  }
);

// Interfaz actualizada para coincidir con la respuesta del API
export interface DashboardStats {
  business_stats: {
    total: number;
    active: number;
    inactive: number;
    by_month: Array<{
      month: string;
      count: number;
    }>;
  };
  user_stats: {
    total: number;
    admins: number;
    staff: number;
    active: number;
  };
  last_updated: string;
}

export default api;