import api from '../axiosConfig';
import { BusinessUser} from '../../types/businessUser';

export interface PaginatedUsers {
  count: number;
  next: string | null;
  previous: string | null;
  results: BusinessUser[];
  total_pages: number; // Propiedad agregada
}

export const getUsers = async (page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> => {
  const response = await api.get(`/users/?page=${page}&page_size=${pageSize}`);
  return {
    ...response.data,
    total_pages: Math.ceil(response.data.count / pageSize) // Calcula total_pages si el backend no lo provee
  };
};

export const getUser = async (id: string): Promise<BusinessUser> => {
  const response = await api.get(`/users/${id}/`);
  return response.data;
};

export const createUser = async (data: Omit<BusinessUser, 'id' | 'created_at'> & { password: string }): Promise<BusinessUser> => {
  const response = await api.post('/users/', data);
  return response.data;
};

export const updateUser = async (id: string, data: Partial<BusinessUser>): Promise<BusinessUser> => {
  const response = await api.patch(`/users/${id}/`, data);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}/`);
};