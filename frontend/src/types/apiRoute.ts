// src/types/apiRoute.ts
export interface ApiRoute {
    id: number;
    path: string;
    external_path: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    requires_auth: boolean;
    request_transformation: Record<string, any>;
    response_transformation: Record<string, any>;
    is_active: boolean;
    config: number; // ID de ExternalApiConfig
    created_at: string;
    updated_at: string;
  }
  
  export interface PaginatedApiRoute {
    count: number;
    next: string | null;
    previous: string | null;
    results: ApiRoute[];
  }