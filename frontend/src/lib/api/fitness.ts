import { api } from '@/lib/api-client';

// Types
export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  demo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface ExerciseListResponse {
  items: Exercise[];
  total: number;
}

export interface ProgramListItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  day_labels: string[];
  exercise_count: number;
  created_at: string;
}

export interface ProgramListResponse {
  items: ProgramListItem[];
}

export interface ProgramExerciseEntry {
  id: string;
  exercise: Exercise;
  sort_order: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
}

export interface ProgramDetail {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  days: Record<string, ProgramExerciseEntry[]>;
  created_at: string;
}

export interface SessionExerciseInfo {
  exercise_id: string;
  exercise_name: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
}

export interface WorkoutLog {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number | null;
  created_at: string;
}

export interface SessionStartResponse {
  id: string;
  program_name: string | null;
  day_label: string | null;
  status: string;
  started_at: string;
  exercises: SessionExerciseInfo[];
}

export interface SessionActiveResponse {
  id: string;
  program_name: string | null;
  day_label: string | null;
  status: string;
  started_at: string;
  exercises: SessionExerciseInfo[];
  logs: WorkoutLog[];
}

export interface ExerciseSummary {
  exercise_name: string;
  sets_completed: number;
  reps_per_set: number[];
}

export interface SessionCompleteResponse {
  id: string;
  program_name: string | null;
  day_label: string | null;
  status: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  notes: string | null;
  summary: ExerciseSummary[];
}

export interface HistoryItem {
  id: string;
  program_name: string | null;
  day_label: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  exercise_count: number;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface FitnessSummary {
  active_program_name: string | null;
  active_program_id: string | null;
  next_day_label: string | null;
  workouts_this_week: string[];
  has_active_session: boolean;
}

// Request types
export interface ExerciseCreateRequest {
  name: string;
  muscle_group?: string | null;
  demo_url?: string | null;
  notes?: string | null;
}

export interface ExerciseUpdateRequest {
  name?: string;
  muscle_group?: string | null;
  demo_url?: string | null;
  notes?: string | null;
}

export interface ProgramCreateRequest {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ProgramUpdateRequest {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ProgramExerciseCreateRequest {
  exercise_id: string;
  day_label: string;
  sort_order?: number;
  target_sets?: number;
  target_reps_min?: number;
  target_reps_max?: number;
  rest_seconds?: number;
}

export interface ProgramExerciseUpdateRequest {
  sort_order?: number;
  target_sets?: number;
  target_reps_min?: number;
  target_reps_max?: number;
  rest_seconds?: number;
}

export interface SessionStartRequest {
  program_id?: string | null;
  day_label?: string | null;
}

export interface WorkoutLogCreateRequest {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg?: number | null;
}

// API client
export const fitnessApi = {
  // Exercises
  listExercises: async (params?: { muscle_group?: string; search?: string }): Promise<ExerciseListResponse> => {
    const query = new URLSearchParams();
    if (params?.muscle_group) query.set('muscle_group', params.muscle_group);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(`/api/v1/exercises${qs ? `?${qs}` : ''}`);
  },

  createExercise: async (data: ExerciseCreateRequest): Promise<Exercise> => {
    return api.post('/api/v1/exercises', data);
  },

  updateExercise: async (id: string, data: ExerciseUpdateRequest): Promise<Exercise> => {
    return api.patch(`/api/v1/exercises/${id}`, data);
  },

  deleteExercise: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/exercises/${id}`);
  },

  // Programs
  listPrograms: async (): Promise<ProgramListResponse> => {
    return api.get('/api/v1/programs');
  },

  getProgram: async (id: string): Promise<ProgramDetail> => {
    return api.get(`/api/v1/programs/${id}`);
  },

  createProgram: async (data: ProgramCreateRequest): Promise<ProgramListItem> => {
    return api.post('/api/v1/programs', data);
  },

  updateProgram: async (id: string, data: ProgramUpdateRequest): Promise<ProgramListItem> => {
    return api.patch(`/api/v1/programs/${id}`, data);
  },

  deleteProgram: async (id: string): Promise<void> => {
    return api.delete(`/api/v1/programs/${id}`);
  },

  // Program Exercises
  addProgramExercise: async (programId: string, data: ProgramExerciseCreateRequest): Promise<ProgramExerciseEntry> => {
    return api.post(`/api/v1/programs/${programId}/exercises`, data);
  },

  updateProgramExercise: async (programId: string, entryId: string, data: ProgramExerciseUpdateRequest): Promise<ProgramExerciseEntry> => {
    return api.patch(`/api/v1/programs/${programId}/exercises/${entryId}`, data);
  },

  deleteProgramExercise: async (programId: string, entryId: string): Promise<void> => {
    return api.delete(`/api/v1/programs/${programId}/exercises/${entryId}`);
  },

  reorderExercises: async (programId: string, dayLabel: string, exerciseOrder: string[]): Promise<void> => {
    return api.put(`/api/v1/programs/${programId}/exercises/reorder`, {
      day_label: dayLabel,
      exercise_order: exerciseOrder,
    });
  },

  // Sessions
  startSession: async (data: SessionStartRequest): Promise<SessionStartResponse> => {
    return api.post('/api/v1/workouts/sessions', data);
  },

  getActiveSession: async (): Promise<SessionActiveResponse> => {
    return api.get('/api/v1/workouts/sessions/active');
  },

  logSet: async (sessionId: string, data: WorkoutLogCreateRequest): Promise<WorkoutLog> => {
    return api.post(`/api/v1/workouts/sessions/${sessionId}/logs`, data);
  },

  completeSession: async (sessionId: string, notes?: string): Promise<SessionCompleteResponse> => {
    return api.patch(`/api/v1/workouts/sessions/${sessionId}/complete`, { notes });
  },

  cancelSession: async (sessionId: string): Promise<void> => {
    return api.patch(`/api/v1/workouts/sessions/${sessionId}/cancel`, {});
  },

  // History
  getHistory: async (params?: { page?: number; per_page?: number; date_from?: string; date_to?: string }): Promise<HistoryResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.date_from) query.set('date_from', params.date_from);
    if (params?.date_to) query.set('date_to', params.date_to);
    const qs = query.toString();
    return api.get(`/api/v1/workouts/history${qs ? `?${qs}` : ''}`);
  },

  // Summary
  getSummary: async (): Promise<FitnessSummary> => {
    return api.get('/api/v1/workouts/summary');
  },
};
