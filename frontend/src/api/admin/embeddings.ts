// frontend/src/api/admin/embeddings.ts
import api from '../axiosConfig';

export interface VectorizationRequest {
  business_id: string;
  source_type: string;
  source_id: string;
}

export interface VectorizationResponse {
  task_id: string;
  status: string;
  monitor_url: string;
  business_id: string;
  source_type: string;
  source_id: string;
}

export interface TaskStatus {
  ready: boolean;
  successful: boolean;
  result: any;
  status: string;
}

export const createEmbedding = async (data: VectorizationRequest): Promise<VectorizationResponse> => {
  const response = await api.post('/embeddings/', data);
  return response.data;
};

export const getTaskStatus = async (taskId: string): Promise<TaskStatus> => {
  const response = await api.get(`/tasks/${taskId}/status/`);
  return response.data;
};