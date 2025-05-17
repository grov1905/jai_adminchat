// src/types/business.ts
export interface Business {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
  }

