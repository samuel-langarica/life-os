// Application constants

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  JOURNAL: '/journal',
  JOURNAL_NEW: '/journal/new',
  JOURNAL_TIMELINE: '/journal/timeline',
  FITNESS: '/fitness',
  FITNESS_PROGRAMS: '/fitness/programs',
  FITNESS_EXERCISES: '/fitness/exercises',
  FITNESS_SESSION: '/fitness/session',
  FITNESS_HISTORY: '/fitness/history',
  PROJECTS: '/projects',
  CAPTURES: '/captures',
  CALENDAR: '/calendar',
  SETTINGS: '/settings',
} as const;

export const API_ROUTES = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_ME: '/api/auth/me',
  DASHBOARD_WEEKLY: '/api/v1/dashboard/weekly',
  JOURNAL_ENTRIES: '/api/v1/journal/entries',
  CAPTURES: '/api/v1/captures',
  CALENDAR_EVENTS: '/api/v1/calendar/events',
  EXERCISES: '/api/v1/exercises',
  PROGRAMS: '/api/v1/programs',
  WORKOUT_SESSIONS: '/api/v1/workouts/sessions',
  PROJECTS: '/api/v1/projects',
} as const;

export const ENTRY_TYPES = {
  MORNING_PAGES: 'morning_pages',
  REFLECTION: 'reflection',
  WEEKLY_REVIEW: 'weekly_review',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  SOMEDAY: 'someday',
  COMPLETED: 'completed',
} as const;

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
