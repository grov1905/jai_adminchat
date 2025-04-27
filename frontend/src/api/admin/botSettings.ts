import api from '../axiosConfig';
import { BotSetting, BotSettingsResponse } from '../../types/botSettings';

export const getBotSettings = async (page: number = 1): Promise<BotSettingsResponse> => {
  const response = await api.get(`/bot-settings/?page=${page}`);
  return response.data;
};

export const getBotSettingByBusiness = async (businessId: string): Promise<BotSetting> => {
  const response = await api.get(`/bot-settings/by_business/?business_id=${businessId}`);
  return response.data;
};

export const getBotSetting = async (id: string): Promise<BotSetting> => {
  const response = await api.get(`/bot-settings/${id}/`);
  return response.data;
};

export const createBotSetting = async (data: Partial<BotSetting>): Promise<BotSetting> => {
  const response = await api.post('/bot-settings/', data);
  return response.data;
};

export const updateBotSetting = async (id: string, data: Partial<BotSetting>): Promise<BotSetting> => {
  const response = await api.patch(`/bot-settings/${id}/`, data);
  return response.data;
};

export const deleteBotSetting = async (id: string): Promise<void> => {
  await api.delete(`/bot-settings/${id}/`);
};