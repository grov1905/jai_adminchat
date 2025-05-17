// src/types/externalApiConfig.ts
export interface ExternalApiConfig {
    id: number;
    name: string;
    base_url: string;
    auth_type: 'api_key' | 'oauth' | 'basic';
    api_key?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface PaginatedExternalApiConfig {
    count: number;
    next: string | null;
    previous: string | null;
    results: ExternalApiConfig[];
  }