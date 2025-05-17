// src/api/admin/chunkingSettings.ts
import api from '../axiosConfig';
import { ChunkingSettings, ChunkingSettingsResponse } from '../../types/chunkingSettings';

export const getChunkingSettings = async (page: number = 1): Promise<ChunkingSettingsResponse> => {
  const response = await api.get(`/chunking-settings/?page=${page}`);
  return response.data;
};

export const getChunkingSettingsByBusiness = async (businessId: string): Promise<ChunkingSettings[]> => {
  const response = await api.get(`/chunking-settings/by_entity/?business_id=${businessId}`);
  return response.data;
};

export const getChunkingSetting = async (id: string): Promise<ChunkingSettings> => {
  const response = await api.get(`/chunking-settings/${id}/`);
  return response.data;
};

export const createChunkingSetting = async (data: Partial<ChunkingSettings>): Promise<ChunkingSettings> => {
  const response = await api.post('/chunking-settings/', data);
  return response.data;
};

export const updateChunkingSetting = async (id: string, data: Partial<ChunkingSettings>): Promise<ChunkingSettings> => {
  const response = await api.patch(`/chunking-settings/${id}/`, data);
  return response.data;
};

export const deleteChunkingSetting = async (id: string): Promise<void> => {
  await api.delete(`/chunking-settings/${id}/`);
};