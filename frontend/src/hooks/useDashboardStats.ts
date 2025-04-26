import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/admin/dashboard';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

interface ErrorResponse {
  detail: string;
}

export const useDashboardStats = () => {
  const navigate = useNavigate();
  
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    retry: (failureCount, error: AxiosError<ErrorResponse>) => {
      if (error.response?.status === 401) {
        navigate('/login');
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000,
  });
};