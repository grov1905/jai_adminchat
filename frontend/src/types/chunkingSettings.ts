// src/types/chunkingSettings.ts
import { Business } from "./business";

export type EntityType = 'document' | 'product_service_item' | 'message' | 'review' | 'other';

export interface ChunkingSettings {
  id: string;
  business_id: string;
  business: Business;
  entity_type: EntityType;
  chunk_size: number;
  chunk_overlap: number;
  created_at: string;
  updated_at: string;
}

export interface ChunkingSettingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChunkingSettings[];
}