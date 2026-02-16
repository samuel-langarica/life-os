# Projects Module - Backend Implementation Complete

## Summary

The complete **Projects module backend** has been successfully implemented and is ready for use. All database tables, models, schemas, repositories, services, and API routes are functional and tested.

---

## Completed Backend Components

### 1. Database Models ✅
**File:** `/Users/samuel/life-os/backend/app/models/project.py`

Three SQLAlchemy models created:
- **Project**: Stores project boards (Barbania, Chaliao, Work)
  - Fields: id, user_id, name, slug, objective, created_at, updated_at
  - Unique slug constraint for URL-friendly routing
  - Relationships to tasks and notes with cascade delete

- **ProjectTask**: Tasks with status workflow
  - Fields: id, project_id, title, description, status, sort_order, created_at, updated_at, completed_at
  - Status enum: BACKLOG, IN_PROGRESS, COMPLETED
  - sort_order enables drag-and-drop reordering
  - completed_at auto-set on status change to COMPLETED

- **ProjectNote**: Free-text notes attached to projects
  - Fields: id, project_id, content, created_at, updated_at
  - Multiple notes per project

**Migration:** Successfully applied - `e0cd2c3c631c_add_projects_tasks_notes_tables.py`

### 2. Pydantic Schemas ✅
**File:** `/Users/samuel/life-os/backend/app/schemas/project.py`

Complete request/response validation schemas:

**Project Schemas:**
- `ProjectCreate` - name, slug, objective
- `ProjectUpdate` - optional name, objective
- `ProjectResponse` - base project data
- `ProjectDetailResponse` - project + grouped tasks + notes

**Task Schemas:**
- `TaskCreate` - title, description, status
- `TaskUpdate` - optional title, description, status, sort_order
- `TaskMoveRequest` - new_status, sort_order (for drag-and-drop)
- `TaskReorderRequest` - status, task_order[] (for reordering within column)
- `TaskResponse` - full task data

**Note Schemas:**
- `NoteCreate` - content
- `NoteUpdate` - content
- `NoteResponse` - full note data

**Helper Schemas:**
- `TasksByStatus` - tasks grouped by in_progress, backlog, completed
- `TaskCountsResponse` - counts per status for dashboard
- `ClearCompletedResponse` - deleted_count

### 3. Repository Layer ✅
**File:** `/Users/samuel/life-os/backend/app/repositories/project.py`

Full async database operations:

**Project Operations:**
- `create_project()` - Create new project
- `get_project_by_id()` - Get with optional eager loading
- `get_project_by_slug()` - Get by slug (for routing)
- `list_projects()` - List all user's projects
- `update_project()` - Update project
- `delete_project()` - Delete with cascade

**Task Operations:**
- `create_task()` - Auto-assigns next sort_order
- `get_task()` - With user ownership verification
- `update_task()` - Auto-sets completed_at timestamp
- `delete_task()` - Delete single task
- `reorder_tasks()` - Batch update sort_order
- `delete_completed_tasks()` - Bulk clear completed
- `get_task_counts_by_project()` - Aggregate counts by status

**Note Operations:**
- `create_note()` - Create note
- `get_note()` - With user ownership verification
- `update_note()` - Update content
- `delete_note()` - Delete note

### 4. Service Layer ✅
**File:** `/Users/samuel/life-os/backend/app/services/project.py`

Business logic implementation:

**Key Features:**
- Automatic ownership verification for all operations
- Auto-set `completed_at` when task status → COMPLETED
- Auto-clear `completed_at` when task status changes from COMPLETED
- Task grouping helper for API responses
- Validation of user permissions via project ownership

**Methods:**
- Project CRUD with ownership checks
- Task lifecycle management
- Task reordering and moving between statuses
- Bulk completed task deletion
- Note management
- Helper: `group_tasks_by_status()` for response formatting

### 5. API Routes ✅
**File:** `/Users/samuel/life-os/backend/app/api/v1/projects.py`

All endpoints per API specification implemented:

**Project Endpoints:**
```
GET    /api/v1/projects              - List all projects with tasks/notes
POST   /api/v1/projects              - Create project
GET    /api/v1/projects/{id}         - Get project by ID
GET    /api/v1/projects/slug/{slug}  - Get project by slug
PATCH  /api/v1/projects/{id}         - Update project
```

**Task Endpoints:**
```
POST   /api/v1/projects/{project_id}/tasks              - Create task
GET    /api/v1/projects/tasks/{task_id}                 - Get task
PATCH  /api/v1/projects/tasks/{task_id}                 - Update task
DELETE /api/v1/projects/tasks/{task_id}                 - Delete task
POST   /api/v1/projects/{project_id}/tasks/reorder      - Reorder tasks
PATCH  /api/v1/projects/tasks/{task_id}/move            - Move task between statuses
DELETE /api/v1/projects/{project_id}/tasks/completed    - Clear completed tasks
```

**Note Endpoints:**
```
POST   /api/v1/projects/{project_id}/notes  - Create note
GET    /api/v1/projects/notes/{note_id}     - Get note
PATCH  /api/v1/projects/notes/{note_id}     - Update note
DELETE /api/v1/projects/notes/{note_id}     - Delete note
```

### 6. Frontend API Client ✅
**File:** `/Users/samuel/life-os/frontend/src/lib/api/projects.ts`

TypeScript client with:
- Full type definitions for all entities (Project, Task, Note)
- Enum for TaskStatus (BACKLOG, IN_PROGRESS, COMPLETED)
- Request/response interfaces
- All API methods matching backend endpoints
- Proper typing throughout

Example usage:
```typescript
import { projectsApi, TaskStatus } from '@/lib/api/projects';

// Get project by slug
const project = await projectsApi.getBySlug('barbania');

// Create task
const task = await projectsApi.createTask(project.id, {
  title: 'Build authentication',
  status: TaskStatus.IN_PROGRESS
});

// Move task
await projectsApi.moveTask(task.id, {
  new_status: TaskStatus.COMPLETED,
  sort_order: 0
});
```

### 7. Integration ✅
- Projects router registered in `/Users/samuel/life-os/backend/app/main.py`
- User model updated with `projects` relationship in `/Users/samuel/life-os/backend/app/models/user.py`
- Database tables created via migration

---

## Database Schema

```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    objective TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project tasks table
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('backlog', 'in_progress', 'completed')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Project notes table
CREATE TABLE project_notes (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX ix_projects_slug ON projects(slug);
CREATE INDEX ix_project_tasks_status ON project_tasks(status);
```

---

## Testing the Backend

### Start the Backend
```bash
cd /Users/samuel/life-os/backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

### Access API Documentation
```
http://localhost:8000/api/docs
```

### Example API Calls

**1. Create a project:**
```bash
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Barbania",
    "slug": "barbania",
    "objective": "Ship prototype v0.1"
  }'
```

**2. Get project by slug:**
```bash
curl http://localhost:8000/api/v1/projects/slug/barbania \
  -b cookies.txt
```

**3. Create a task:**
```bash
curl -X POST http://localhost:8000/api/v1/projects/{PROJECT_ID}/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Design onboarding flow",
    "status": "in_progress"
  }'
```

**4. Move task between columns:**
```bash
curl -X PATCH http://localhost:8000/api/v1/projects/tasks/{TASK_ID}/move \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "new_status": "completed",
    "sort_order": 0
  }'
```

**5. Clear completed tasks:**
```bash
curl -X DELETE http://localhost:8000/api/v1/projects/{PROJECT_ID}/tasks/completed \
  -b cookies.txt
```

---

## Seed Data (Optional)

To create the 3 default projects, run:

```sql
-- Get your user ID
SELECT id FROM users LIMIT 1;

-- Insert 3 projects (replace YOUR_USER_ID)
INSERT INTO projects (user_id, name, slug, objective) VALUES
  ('YOUR_USER_ID', 'Barbania', 'barbania', 'Ship prototype v0.1'),
  ('YOUR_USER_ID', 'Chaliao', 'chaliao', 'Finalize Q1 pricing'),
  ('YOUR_USER_ID', 'Work', 'work', 'Complete API migration');
```

Or use the API:
```bash
for project in "Barbania:barbania:Ship prototype v0.1" "Chaliao:chaliao:Finalize Q1 pricing" "Work:work:Complete API migration"; do
  IFS=: read name slug objective <<< "$project"
  curl -X POST http://localhost:8000/api/v1/projects \
    -H "Content-Type: application/json" \
    -b cookies.txt \
    -d "{\"name\":\"$name\",\"slug\":\"$slug\",\"objective\":\"$objective\"}"
done
```

---

## Frontend Implementation Guide

### Remaining Work: 3 Components

#### 1. Projects Page (Main UI)
**File:** `/Users/samuel/life-os/frontend/src/app/(authenticated)/projects/page.tsx`

**Required Features:**
- Tab navigation for 3 projects (Barbania, Chaliao, Work)
- Objective display + inline editing
- Kanban board with 3 columns:
  - Backlog
  - In Progress
  - Completed
- Task cards with drag-and-drop
- "Add Task" button per column
- Notes section below board
- "Clear Completed" button in completed column

**Recommended Libraries:**
- **Drag-and-Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
  - Modern, accessible, React 18 compatible
  - Better than react-beautiful-dnd for new projects
  - Install: `npm install @dnd-kit/core @dnd-kit/sortable`

**Implementation Pattern:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { projectsApi, ProjectDetail, TaskStatus } from '@/lib/api/projects';
import TaskCard from '@/components/projects/TaskCard';
import KanbanColumn from '@/components/projects/KanbanColumn';

const PROJECTS = ['barbania', 'chaliao', 'work'];

export default function ProjectsPage() {
  const [activeSlug, setActiveSlug] = useState('barbania');
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject(activeSlug);
  }, [activeSlug]);

  const loadProject = async (slug: string) => {
    setLoading(true);
    try {
      const data = await projectsApi.getBySlug(slug);
      setProject(data);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of implementation
}
```

#### 2. Task Components
**Files:**
- `/Users/samuel/life-os/frontend/src/components/projects/TaskCard.tsx`
- `/Users/samuel/life-os/frontend/src/components/projects/TaskModal.tsx`
- `/Users/samuel/life-os/frontend/src/components/projects/KanbanColumn.tsx`

**TaskCard** - Draggable card:
```typescript
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}
```

**TaskModal** - Create/edit form:
```typescript
interface TaskModalProps {
  open: boolean;
  task?: Task;
  projectId: string;
  defaultStatus: TaskStatus;
  onClose: () => void;
  onSave: () => void;
}
```

**KanbanColumn** - Column wrapper:
```typescript
interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: () => void;
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
}
```

#### 3. Dashboard Widget
**File:** `/Users/samuel/life-os/frontend/src/components/dashboard/ProjectsWidget.tsx`

**Required Display:**
- All 3 project names
- Current objective for each
- Task counts (X in progress, Y in backlog)
- Link to projects page

**Implementation:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { projectsApi, ProjectDetail } from '@/lib/api/projects';
import Link from 'next/link';

export default function ProjectsWidget() {
  const [projects, setProjects] = useState<ProjectDetail[]>([]);

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(console.error);
  }, []);

  return (
    <div className="widget">
      <h2>Current Objectives</h2>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.objective || 'No objective set'}</p>
          <p>
            {project.tasks.in_progress.length} in progress,
            {project.tasks.backlog.length} backlog
          </p>
        </div>
      ))}
      <Link href="/projects">Manage Projects →</Link>
    </div>
  );
}
```

Then add to dashboard page:
```typescript
// In /Users/samuel/life-os/frontend/src/app/(authenticated)/dashboard/page.tsx
import ProjectsWidget from '@/components/dashboard/ProjectsWidget';

// Add in render:
<ProjectsWidget />
```

---

## Key Features Implemented

✅ **Multi-project boards** - 3 separate kanban boards (Barbania, Chaliao, Work)
✅ **Task status workflow** - Backlog → In Progress → Completed
✅ **Drag-and-drop ready** - sort_order column + reorder/move endpoints
✅ **Auto-timestamping** - completed_at set automatically on completion
✅ **Bulk operations** - Clear all completed tasks
✅ **Notes system** - Multiple notes per project with timestamps
✅ **Slug-based routing** - Clean URLs: `/projects/barbania`
✅ **Ownership verification** - All operations check user permissions
✅ **Fully typed** - TypeScript types for all entities
✅ **Optimistic updates ready** - Structured for good UX patterns

---

## API Specification Compliance

All endpoints match the specification in:
`/Users/samuel/life-os/product-design/02_API_SPECIFICATION.md` (Projects section)

Deviations: None - 100% compliant

---

## Production Readiness

The backend implementation is **production-ready** and follows the same patterns as existing modules (Journal, Calendar, Captures):

✅ Properly authenticated (cookie + bearer token support)
✅ User ownership verified on all operations
✅ Error handling with custom exceptions
✅ Async/await throughout
✅ Fully typed with Pydantic validation
✅ Auto-documented in OpenAPI/Swagger
✅ Database migrations applied
✅ Optimized queries with eager loading options
✅ Transaction safety (auto-commit/rollback)

---

## Files Created/Modified

**Backend (Complete):**
- ✅ `/Users/samuel/life-os/backend/app/models/project.py` (created - 150 lines)
- ✅ `/Users/samuel/life-os/backend/app/schemas/project.py` (created - 160 lines)
- ✅ `/Users/samuel/life-os/backend/app/repositories/project.py` (created - 280 lines)
- ✅ `/Users/samuel/life-os/backend/app/services/project.py` (created - 230 lines)
- ✅ `/Users/samuel/life-os/backend/app/api/v1/projects.py` (created - 260 lines)
- ✅ `/Users/samuel/life-os/backend/app/models/user.py` (updated - added projects relationship)
- ✅ `/Users/samuel/life-os/backend/app/main.py` (updated - registered projects router)
- ✅ `/Users/samuel/life-os/backend/alembic/versions/e0cd2c3c631c_add_projects_tasks_notes_tables.py` (migration)

**Frontend (Partial):**
- ✅ `/Users/samuel/life-os/frontend/src/lib/api/projects.ts` (created - 200 lines)
- ⏳ `/Users/samuel/life-os/frontend/src/app/(authenticated)/projects/page.tsx` (pending)
- ⏳ `/Users/samuel/life-os/frontend/src/components/projects/TaskCard.tsx` (pending)
- ⏳ `/Users/samuel/life-os/frontend/src/components/projects/TaskModal.tsx` (pending)
- ⏳ `/Users/samuel/life-os/frontend/src/components/projects/KanbanColumn.tsx` (pending)
- ⏳ `/Users/samuel/life-os/frontend/src/components/dashboard/ProjectsWidget.tsx` (pending)

---

## Next Steps

### Frontend Implementation (Remaining)

**Priority 1: Projects Page**
1. Create main page with tab navigation
2. Implement kanban board layout
3. Add task cards
4. Integrate drag-and-drop
5. Add task creation/edit/delete
6. Implement notes section

**Priority 2: Dashboard Integration**
1. Create ProjectsWidget component
2. Add to dashboard page
3. Test data fetching and display

**Priority 3: Polish**
1. Loading states
2. Error handling
3. Optimistic updates
4. Empty states
5. Animations/transitions

**Estimated Time:** 4-6 hours for complete frontend implementation

---

## Example Workflows

### Creating a complete project workflow:

```typescript
// 1. Create project
const project = await projectsApi.create({
  name: 'Barbania',
  slug: 'barbania',
  objective: 'Ship prototype v0.1'
});

// 2. Add tasks to backlog
await projectsApi.createTask(project.id, {
  title: 'Design landing page',
  status: TaskStatus.BACKLOG
});

// 3. Move task to in progress
await projectsApi.moveTask(taskId, {
  new_status: TaskStatus.IN_PROGRESS,
  sort_order: 0
});

// 4. Add project note
await projectsApi.createNote(project.id, {
  content: 'Focus on core features. Avoid feature creep.'
});

// 5. Complete task
await projectsApi.updateTask(taskId, {
  status: TaskStatus.COMPLETED
});

// 6. Clear all completed
await projectsApi.clearCompletedTasks(project.id);
```

---

## Success Criteria

✅ **Backend Complete** - All endpoints functional
✅ **Database Migrated** - Tables created successfully
✅ **API Client Ready** - TypeScript types and methods
✅ **Documentation Complete** - This guide + inline docs
✅ **Tested** - Manual API testing successful
✅ **Production Ready** - Security, validation, error handling

---

**Status:** Backend 100% Complete ✓  
**Frontend:** API client complete, UI pending  
**Estimated Frontend Time:** 4-6 hours  
**Created:** 2026-02-16  
**Next Module:** Frontend UI implementation  
