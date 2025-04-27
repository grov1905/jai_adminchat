// src/api/admin/botTemplates.ts
import api from '../axiosConfig';
import { BotTemplate, BotTemplatesResponse, BotTemplateType } from '../../types/botTemplates';

export const getBotTemplates = async (businessId: string, page: number = 1): Promise<BotTemplatesResponse> => {
  const response = await api.get(`/bot-templates/?business=${businessId}&page=${page}`);
  return response.data;
};

export const getBotTemplatesByType = async (
  businessId: string, 
  type: BotTemplateType, 
  page: number = 1
): Promise<BotTemplatesResponse> => {
  const response = await api.get(`/bot-templates/by_type/?business_id=${businessId}&type=${type}&page=${page}`);
  return response.data;
};

export const getBotTemplate = async (id: string): Promise<BotTemplate> => {
  const response = await api.get(`/bot-templates/${id}/`);
  return response.data;
};

export const createBotTemplate = async (data: Partial<BotTemplate>): Promise<BotTemplate> => {
  const response = await api.post('/bot-templates/', data);
  return response.data;
};

export const updateBotTemplate = async (id: string, data: Partial<BotTemplate>): Promise<BotTemplate> => {
  const response = await api.patch(`/bot-templates/${id}/`, data);
  return response.data;
};

export const deleteBotTemplate = async (id: string): Promise<void> => {
  await api.delete(`/bot-templates/${id}/`);
};