export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    created_at: string;
    is_active: boolean;
  }
  
  export interface PaginatedRoles {
    count: number;
    next: string | null;
    previous: string | null;
    results: Role[];
  }