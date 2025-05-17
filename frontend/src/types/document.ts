// frontend/src/types/document.ts
import { Business } from './business';

export interface Document {
  id: string;
  file: string;  
  business: Business;
  name: string;
  type: string;
  file_path: string;
  file_hash: string;
  content_text: string;
  created_at: string;
  updated_at: string;
  custom_metadata?: Record<string, any>;
}

export interface DocumentsResponse {
  results: Document[];
  count: number;
  next: string | null;
  previous: string | null;
  total_pages: number;
}