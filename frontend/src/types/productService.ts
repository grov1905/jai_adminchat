// frontend/src/types/productService.ts
import { Business } from './business';

export interface ProductService {
  id: string;
  business: Business;
  name: string;
  description: string;
  category: string;
  price: string;
  created_at: string;
  updated_at: string;
  custom_metadata?: Record<string, any>;
}

export interface ProductsServicesResponse {
  results: ProductService[];
  count: number;
}