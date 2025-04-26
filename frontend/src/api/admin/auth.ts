// src/api/admin/auth.ts
import api from '../axiosConfig';

export const loginUser = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/token/', credentials);
  return {
    access: response.data.access,
    refresh: response.data.refresh,
  };
};

export const refreshToken = async (refresh: string) => {
  const response = await api.post('/token/refresh/', { refresh });
  return response.data.access;
};