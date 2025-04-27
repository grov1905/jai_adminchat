// src/types/botSettings.ts
import { Business } from "./business";

export interface BotSetting {
  id: string;
  business_id: string;
  business: Business;
  llm_model_name: string;
  embedding_model_name: string;
  sentiment_model_name: string;
  intent_model_name: string;
  search_top_k: number;
  search_min_similarity: number;
  generation_temperature: number;
  generation_top_p: number;
  generation_top_k: number;
  generation_frequency_penalty: number;
  generation_presence_penalty: number;
  created_at: string;
  updated_at: string;

}

export interface BotSettingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BotSetting[];
}