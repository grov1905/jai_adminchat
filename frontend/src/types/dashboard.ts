// types.ts
export interface BusinessStats {
    total: number;
    active: number;
    inactive: number;
    by_month: Array<{
      month: string;
      count: number;
    }>;
  }
  
  export interface UserStats {
    total: number;
    admins: number;
    staff: number;
    active: number;
  }
  
  export interface DashboardStats {
    business_stats: BusinessStats;
    user_stats: UserStats;
    last_updated: string;
  }