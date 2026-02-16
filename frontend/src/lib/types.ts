// Shared TypeScript types matching API schemas

export interface User {
  id: string;
  username: string;
  display_name: string;
  theme: 'light' | 'dark' | 'auto';
  week_start_day: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

// Dashboard types
export interface DashboardData {
  week_start: string;
  week_end: string;
  pending_actions: PendingAction[];
  today_events: CalendarEvent[];
  workout_week: WorkoutWeekData;
  journal_status: JournalStatus;
  project_objectives: ProjectObjective[];
  inbox_count: number;
}

export interface PendingAction {
  id: string;
  type: 'task' | 'capture' | 'review';
  title: string;
  due_date?: string;
  project?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
}

export interface WorkoutWeekData {
  planned_sessions: number;
  completed_sessions: number;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  date: string;
  status: 'planned' | 'completed' | 'skipped' | 'rest';
}

export interface JournalStatus {
  morning_pages_done: boolean;
  reflection_done: boolean;
  weekly_review_due: boolean;
  current_streak: number;
}

export interface ProjectObjective {
  project_slug: string;
  project_name: string;
  objective: string;
  progress: number;
}

// Journal types
export interface JournalEntry {
  id: string;
  entry_type: 'morning_pages' | 'reflection' | 'weekly_review';
  entry_date: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Capture types
export interface Capture {
  id: string;
  content: string;
  status: 'inbox' | 'processed' | 'archived';
  source: 'web' | 'api';
  created_at: string;
}

// Calendar types
export interface CalendarEventDetail extends CalendarEvent {
  description?: string;
  location?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  parent_event_id?: string;
}

// Fitness types
export interface Exercise {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  day_of_week: number;
  sets: number;
  target_reps?: string;
  target_weight?: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  program_id?: string;
  program_name?: string;
  started_at: string;
  completed_at?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface WorkoutLog {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight?: number;
  notes?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  slug: string;
  objective?: string;
  status: 'active' | 'someday' | 'completed';
  sort_order: number;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed';
  sort_order: number;
  due_date?: string;
  notes?: string;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}
