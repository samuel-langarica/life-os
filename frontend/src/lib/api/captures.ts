import { api } from '@/lib/api-client';

export interface Capture {
  id: string;
  text: string;
  source: string;
  processed: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CaptureListResponse {
  captures: Capture[];
  total: number;
  unprocessed_count: number;
}

export const capturesApi = {
  list: async (includeProcessed: boolean = false): Promise<CaptureListResponse> => {
    return api.get(`/api/v1/captures?include_processed=${includeProcessed}`);
  },

  create: async (text: string, source: string = 'manual'): Promise<Capture> => {
    return api.post('/api/v1/captures', { text, source });
  },

  update: async (id: string, data: { processed?: boolean; text?: string }): Promise<Capture> => {
    return api.patch(`/api/v1/captures/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/captures/${id}`);
  },

  getCount: async (): Promise<{ count: number }> => {
    return api.get('/api/v1/captures/count');
  },
};
