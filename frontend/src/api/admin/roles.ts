import api from '../axiosConfig';
import { Role, PaginatedRoles } from '../../types/role';

export const getRoles = async (page: number = 1): Promise<PaginatedRoles> => {
  const response = await api.get(`/roles/?page=${page}`);
  return response.data;
};

export const getRole = async (id: string): Promise<Role> => {
  const response = await api.get(`/roles/${id}/`);
  return response.data;
};

export const createRole = async (data: Omit<Role, 'id' | 'created_at'>): Promise<Role> => {
  const response = await api.post('/roles/', data);
  return response.data;
};

export const updateRole = async (id: string, data: Partial<Role>): Promise<Role> => {
  const response = await api.put(`/roles/${id}/`, data);
  return response.data;
};

export const deleteRole = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}/`);
};