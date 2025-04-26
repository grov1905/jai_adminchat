import api from '../axiosConfig';

export interface DashboardStats {
  business: {
    active_businesses: number;
    total_businesses: number;
    businesses_by_status: Record<string, number>;
  };
  users: {
    total_users: number;
    admin_users: number;
    active_users: number;
    users_by_role: Record<string, number>;
  };
  last_updated: string;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats/');
  return response.data;
};