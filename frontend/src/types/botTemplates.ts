// src/types/botTemplates.ts
import { Business } from "./business";

export type BotTemplateType = 'greeting' | 'farewell' | 'sales' | 'support' | 'other';

export interface BotTemplate {
  id: string;
  business_id: string;
  business: Business;
  name: string;
  type: BotTemplateType;
  prompt_template: string;
  temperature: number;
  top_p: number;
  top_k: number;
  frequency_penalty: number;
  presence_penalty: number;
  created_at: string;
  updated_at: string;
}

export interface BotTemplatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BotTemplate[];
}