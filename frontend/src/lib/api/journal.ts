import { api } from '@/lib/api-client';

export type EntryType = 'morning_pages' | 'daily_reflection' | 'weekly_review';

export interface JournalEntry {
  id: string;
  entry_type: EntryType;
  entry_date: string;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface JournalStatus {
  morning_pages_streak: number;
  daily_reflection_streak: number;
  entries_this_week: number;
  weekly_review_completed: boolean;
}

export const journalApi = {
  list: async (params?: {
    start_date?: string;
    end_date?: string;
    entry_type?: EntryType;
  }): Promise<{ entries: JournalEntry[]; total: number }> => {
    const query = new URLSearchParams(params as any).toString();
    return api.get(`/api/v1/journal/entries${query ? `?${query}` : ''}`);
  },

  create: async (data: {
    entry_type: EntryType;
    entry_date: string;
    content: Record<string, any>;
  }): Promise<JournalEntry> => {
    return api.post('/api/v1/journal/entries', data);
  },

  get: async (id: string): Promise<JournalEntry> => {
    return api.get(`/api/v1/journal/entries/${id}`);
  },

  getByTypeAndDate: async (
    entryType: EntryType,
    entryDate: string
  ): Promise<JournalEntry | null> => {
    return api.get(`/api/v1/journal/entries/type/${entryType}/date/${entryDate}`);
  },

  update: async (id: string, content: Record<string, any>): Promise<JournalEntry> => {
    return api.patch(`/api/v1/journal/entries/${id}`, { content });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/journal/entries/${id}`);
  },

  getStatus: async (): Promise<JournalStatus> => {
    return api.get('/api/v1/journal/status');
  },
};
