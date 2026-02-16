import { api } from '@/lib/api-client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  series_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventListResponse {
  events: CalendarEvent[];
  total: number;
}

export const calendarApi = {
  list: async (startDate: string, endDate: string): Promise<CalendarEventListResponse> => {
    return api.get(`/api/v1/calendar/events?start_date=${startDate}&end_date=${endDate}`);
  },

  create: async (data: {
    title: string;
    description?: string;
    event_date: string;
    start_time: string;
    end_time: string;
    is_recurring?: boolean;
    recurrence_pattern?: string;
    recurrence_end_date?: string;
    recurrence_days?: number[];
  }): Promise<CalendarEvent> => {
    return api.post('/api/v1/calendar/events', data);
  },

  get: async (id: string): Promise<CalendarEvent> => {
    return api.get(`/api/v1/calendar/events/${id}`);
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      event_date?: string;
      start_time?: string;
      end_time?: string;
    },
    updateScope: 'single' | 'future' | 'all' = 'single'
  ): Promise<CalendarEvent> => {
    return api.patch(`/api/v1/calendar/events/${id}?update_scope=${updateScope}`, data);
  },

  delete: async (id: string, deleteScope: 'single' | 'future' | 'all' = 'single'): Promise<void> => {
    return api.delete(`/api/v1/calendar/events/${id}?delete_scope=${deleteScope}`);
  },
};
