// src/api/admin/business.ts
import api from '../axiosConfig';

export interface Business {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  is_active: boolean;
}

// En tu archivo de tipos o api/admin/business.ts
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
  }

  export interface BusinessResponse extends PaginatedResponse<Business> {}

export const getBusinesses = async (page: number = 1) => {
    const response = await api.get(`/businesses/?page=${page}`);
    return response.data;  // Ahora recibe {count, next, previous, results}
  };

export const getBusiness = async (id: string) => {
  const response = await api.get(`/businesses/${id}/`);
  return response.data;
};

export const createBusiness = async (data: Omit<Business, 'id' | 'created_at'>) => {
  const response = await api.post('/businesses/', data);
  return response.data;
};

export const updateBusiness = async (id: string, data: Partial<Business>) => {
  const response = await api.patch(`/businesses/${id}/`, data);
  return response.data;
};

export const deleteBusiness = async (id: string) => {
  await api.delete(`/businesses/${id}/`);
};