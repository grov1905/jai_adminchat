// src/api/admin/externalApiConfig.ts
import api from '../axiosConfig';
import { ExternalApiConfig, PaginatedExternalApiConfig } from '../../types/externalApiConfig';

export const getExternalApiConfigs = async (page: number = 1, pageSize: number = 10): Promise<PaginatedExternalApiConfig> => {
  const response = await api.get(`/external-api-configs/?page=${page}&page_size=${pageSize}`);
  return response.data;
};

export const getExternalApiConfig = async (id: number): Promise<ExternalApiConfig> => {
  const response = await api.get(`/external-api-configs/${id}/`);
  return response.data;
};

export const createExternalApiConfig = async (data: Omit<ExternalApiConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ExternalApiConfig> => {
  const response = await api.post('/external-api-configs/', data);
  return response.data;
};

export const updateExternalApiConfig = async (id: number, data: Partial<ExternalApiConfig>): Promise<ExternalApiConfig> => {
  const response = await api.patch(`/external-api-configs/${id}/`, data);
  return response.data;
};

export const deleteExternalApiConfig = async (id: number): Promise<void> => {
  await api.delete(`/external-api-configs/${id}/`);
};