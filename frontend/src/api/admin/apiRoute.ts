// src/api/admin/apiRoute.ts
import api from '../axiosConfig';
import { ApiRoute, PaginatedApiRoute } from '../../types/apiRoute';

export const getApiRoutes = async (page: number = 1, pageSize: number = 10): Promise<PaginatedApiRoute> => {
  const response = await api.get(`/api-routes/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const getApiRoute = async (id: number): Promise<ApiRoute> => {
  const response = await api.get(`/api-routes/${id}/`);
  return response.data;
};

export const createApiRoute = async (data: Omit<ApiRoute, 'id' | 'created_at' | 'updated_at'>): Promise<ApiRoute> => {
  const response = await api.post('/api-routes/', data);
  return response.data;
};

export const updateApiRoute = async (id: number, data: Partial<Omit<ApiRoute, 'config'>>): Promise<ApiRoute> => {
  const response = await api.patch(`/api-routes/${id}/`, data);
  return response.data;
};
export const deleteApiRoute = async (id: number): Promise<void> => {
    await api.delete(`/api-routes/${id}/`);
  };