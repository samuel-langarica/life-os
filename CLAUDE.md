# Life OS (Command)

Personal productivity system. Monorepo with a FastAPI backend and Next.js frontend.

## Project Structure

```
backend/          Python FastAPI backend
  app/
    api/v1/       Route handlers (auth, calendar, captures, fitness, journal, projects)
    models/       SQLAlchemy ORM models
    repositories/ Data access layer
    services/     Business logic layer
    schemas/      Pydantic request/response schemas
    dependencies/ Auth + DB dependency injection
  tests/          pytest tests
  alembic/        Database migrations (PostgreSQL)

frontend/         Next.js 14 (App Router, TypeScript)
  src/
    app/
      (auth)/           Unauthenticated routes (login)
      (authenticated)/  Protected routes (dashboard, calendar, journal, fitness, projects, captures)
    components/
      ui/          Base components (button, card, input, spinner, textarea)
      layout/      AppShell, Sidebar, BottomNav, TopBar, ThemeToggle, InboxDropdown
      dashboard/   Dashboard widgets
      calendar/    EventModal
      captures/    QuickCaptureModal, FloatingCaptureButton
      projects/    KanbanColumn, TaskCard, ObjectiveModal, NotesModal, TaskModal
    lib/
      api/         API client modules per domain
      api-client.ts   Fetch wrapper with auth token refresh
      utils.ts     Helpers
    stores/        Zustand stores (auth, capture, workout)
    hooks/         Custom hooks (useCalendar)
    middleware.ts  Route protection

product-design/   Specs and architecture docs
nginx/            Reverse proxy config
```

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (async), PostgreSQL, Alembic, JWT auth (httpOnly cookies)
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, SWR, Lucide icons, Radix UI
- **Infra:** Docker Compose, Nginx reverse proxy

## Design System

Dark-first with light mode support. See `frontend/COMMAND_DESIGN_SYSTEM.md` for full reference.

- **Theming:** CSS custom properties in `globals.css` (`:root` = dark, `.light` = light). Toggled via `ThemeToggle` component, persisted in localStorage.
- **Colors:** Always use design tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-secondary`, `text-muted-foreground`, `bg-primary`, etc.). Never use raw Tailwind colors like `bg-white`, `text-gray-*`, `bg-gray-*`. Never use `dark:` variants.
- **Accent:** Amber (`--primary: 38 92% 50%`) used for CTAs, active states, focus rings
- **Icons:** Lucide React, no emojis
- **Fonts:** Geist (sans), Berkeley Mono (mono)
- **Tone:** Professional, precise. No emojis in UI copy.

## Commands

```bash
# Backend
cd backend && uvicorn app.main:app --reload          # Dev server (port 8000)
cd backend && pytest                                  # Run tests
cd backend && alembic upgrade head                    # Run migrations
cd backend && alembic revision --autogenerate -m ""   # Create migration

# Frontend
cd frontend && npm run dev       # Dev server (port 3000)
cd frontend && npm run build     # Production build

# Full stack
docker compose up                # Everything via Docker
```

## Backend Patterns

- **Layered architecture:** Routes -> Services -> Repositories -> Models
- **Auth:** JWT access tokens in httpOnly cookies, refresh token rotation
- **All endpoints** require auth via `get_current_user` dependency (except healthcheck, login, register)
- **Database sessions** injected via `get_db` dependency

## Frontend Patterns

- **Data fetching:** SWR with API client that auto-refreshes tokens on 401
- **State:** Zustand for client state (auth, modals, workout timer), SWR for server state
- **Routing:** Next.js App Router with route groups: `(auth)` for public, `(authenticated)` for protected
- **Auth flow:** Middleware checks cookie -> redirects to /login if missing
- **Components:** Use `bg-card`, `text-foreground`, `border-border` etc. for all styling (not raw colors)
