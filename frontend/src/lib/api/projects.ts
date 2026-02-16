import { api } from '@/lib/api-client';

// Enums
export enum TaskStatus {
  BACKLOG = 'backlog',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// Types
export interface Project {
  id: string;
  name: string;
  slug: string;
  objective: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Note {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TasksByStatus {
  in_progress: Task[];
  backlog: Task[];
  completed: Task[];
}

export interface ProjectDetail extends Project {
  tasks: TasksByStatus;
  notes: Note[];
}

export interface TaskCounts {
  in_progress: number;
  backlog: number;
  completed: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  objective: string | null;
  task_counts: TaskCounts;
}

// Request types
export interface ProjectCreateRequest {
  name: string;
  slug: string;
  objective?: string | null;
}

export interface ProjectUpdateRequest {
  name?: string;
  objective?: string | null;
}

export interface TaskCreateRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  sort_order?: number;
}

export interface TaskMoveRequest {
  new_status: TaskStatus;
  sort_order: number;
}

export interface TaskReorderRequest {
  status: TaskStatus;
  task_order: string[];
}

export interface NoteCreateRequest {
  content: string;
}

export interface NoteUpdateRequest {
  content: string;
}

// API client
export const projectsApi = {
  // Projects
  list: async (): Promise<ProjectDetail[]> => {
    return api.get('/api/v1/projects');
  },

  create: async (data: ProjectCreateRequest): Promise<Project> => {
    return api.post('/api/v1/projects', data);
  },

  get: async (projectId: string): Promise<ProjectDetail> => {
    return api.get(`/api/v1/projects/${projectId}`);
  },

  getBySlug: async (slug: string): Promise<ProjectDetail> => {
    return api.get(`/api/v1/projects/slug/${slug}`);
  },

  update: async (projectId: string, data: ProjectUpdateRequest): Promise<Project> => {
    return api.patch(`/api/v1/projects/${projectId}`, data);
  },

  delete: async (projectId: string): Promise<void> => {
    return api.delete(`/api/v1/projects/${projectId}`);
  },

  // Tasks
  createTask: async (projectId: string, data: TaskCreateRequest): Promise<Task> => {
    return api.post(`/api/v1/projects/${projectId}/tasks`, data);
  },

  getTask: async (taskId: string): Promise<Task> => {
    return api.get(`/api/v1/projects/tasks/${taskId}`);
  },

  updateTask: async (taskId: string, data: TaskUpdateRequest): Promise<Task> => {
    return api.patch(`/api/v1/projects/tasks/${taskId}`, data);
  },

  deleteTask: async (taskId: string): Promise<void> => {
    return api.delete(`/api/v1/projects/tasks/${taskId}`);
  },

  reorderTasks: async (projectId: string, data: TaskReorderRequest): Promise<void> => {
    return api.post(`/api/v1/projects/${projectId}/tasks/reorder`, data);
  },

  moveTask: async (taskId: string, data: TaskMoveRequest): Promise<Task> => {
    return api.patch(`/api/v1/projects/tasks/${taskId}/move`, data);
  },

  clearCompletedTasks: async (projectId: string): Promise<{ deleted_count: number }> => {
    return api.delete(`/api/v1/projects/${projectId}/tasks/completed`);
  },

  // Notes
  createNote: async (projectId: string, data: NoteCreateRequest): Promise<Note> => {
    return api.post(`/api/v1/projects/${projectId}/notes`, data);
  },

  getNote: async (noteId: string): Promise<Note> => {
    return api.get(`/api/v1/projects/notes/${noteId}`);
  },

  updateNote: async (noteId: string, data: NoteUpdateRequest): Promise<Note> => {
    return api.patch(`/api/v1/projects/notes/${noteId}`, data);
  },

  deleteNote: async (noteId: string): Promise<void> => {
    return api.delete(`/api/v1/projects/notes/${noteId}`);
  },
};
