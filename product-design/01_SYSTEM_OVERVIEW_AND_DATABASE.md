# Life OS - Technical Architecture (Part 1)
# System Overview and Database Schema

---

## 1. SYSTEM OVERVIEW

### Architecture Diagram

```
                          Internet
                             |
                     [ Nginx Reverse Proxy ]
                     (SSL termination, :443)
                        /            \
                       /              \
          [ Next.js Frontend ]    [ FastAPI Backend ]
          (Node.js, :3000)        (Uvicorn, :8000)
               |                       |
               |                       |
               +--------> [ PostgreSQL Database ]
                            (:5432)
                               |
                          [ Docker Network ]
                          (All containers on VPS "syrax")
```

### Stack Decisions

```
Frontend: Next.js 14 (App Router)
  Why: SSR for initial load speed, App Router for layouts/nested routing,
       built-in API route capability (unused - we use FastAPI), excellent
       PWA tooling, Vercel-quality DX even self-hosted.

Backend: FastAPI (Python 3.12)
  Why: Async-native, auto-generated OpenAPI docs, Pydantic validation,
       excellent for typed REST APIs. Single developer productivity.

Database: PostgreSQL 16
  Why: JSONB for flexible journal content, robust date/time handling
       for calendar, excellent indexing, battle-tested reliability.

Auth: JWT with httpOnly cookies (session) + Bearer tokens (external API)
  Why: httpOnly cookies prevent XSS token theft for browser sessions.
       Bearer tokens enable Siri Shortcuts integration.

Deployment: Docker Compose on VPS "syrax"
  Why: Single-machine simplicity, full control, no vendor lock-in.
       Compose orchestrates all services with one command.

Alternative considered: Supabase
  Rejected because: Self-hosted gives full control over data, no
  subscription costs, and the backend logic (workout sessions, streak
  calculation, recurring events) benefits from a proper service layer.
```

### Data Flow Summary

```
Browser/PWA                FastAPI                    PostgreSQL
-----------                -------                    ----------
Login form     --POST-->   /api/auth/login            Verify password hash
               <--200---   Set httpOnly cookie         Return user row

Dashboard      --GET--->   /api/v1/dashboard/weekly   JOIN across 5+ tables
               <--200---   Aggregated JSON             Query current week data

Siri Shortcut  --POST-->   /api/v1/captures           INSERT capture row
(Bearer token)  <--201---  Capture confirmation        Return new capture

Workout timer  --POST-->   /api/v1/workouts/sessions  INSERT session + logs
(cookie auth)  <--201---   Session summary             Transaction commit
```

---

## 2. DATA ENTITIES

Extracted from UX flows:

```
1. User           - Single user account (auth + preferences)
2. JournalEntry   - Morning pages, daily reflections, weekly reviews
3. Exercise       - Exercise catalog (pull-ups, squats, etc.)
4. WorkoutProgram - Named program (Upper/Lower Split, PPL, etc.)
5. ProgramExercise - Junction: which exercises in which program + order
6. WorkoutSession - A single workout instance with timer data
7. WorkoutLog     - Individual exercise log within a session (sets/reps)
8. Project        - One of 3 boards (Barbania, Chaliao, Work)
9. ProjectTask    - Tasks within a project (in_progress/backlog/completed)
10. ProjectNote   - Free-text notes attached to a project
11. Capture       - Inbox item from manual entry or Siri Shortcuts
12. CalendarEvent - Events with optional weekly recurrence
13. ApiKey        - Bearer tokens for external API access (Shortcuts)
```

---

## 3. COMPLETE DATABASE SCHEMA

### Conventions

- All primary keys: UUID v4 (stored as `uuid` type)
- All tables include `created_at` and `updated_at` timestamps
- `updated_at` auto-updates via trigger
- Foreign keys use `ON DELETE CASCADE` unless noted otherwise
- All text fields use `TEXT` (PostgreSQL treats TEXT and VARCHAR identically)
- Indexes named: `idx_{table}_{column(s)}`

---

### Table: users

Single row. Stores auth credentials and preferences.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        TEXT NOT NULL UNIQUE DEFAULT 'samuel',
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL DEFAULT 'Samuel',
    theme           TEXT NOT NULL DEFAULT 'auto'
                    CHECK (theme IN ('light', 'dark', 'auto')),
    week_start_day  SMALLINT NOT NULL DEFAULT 1
                    CHECK (week_start_day BETWEEN 0 AND 6),
                    -- 0=Sunday, 1=Monday
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single user constraint (extra safety)
CREATE UNIQUE INDEX idx_users_singleton ON users ((true));
```

**Notes:**
- The singleton index ensures only one row can ever exist.
- `week_start_day` drives calendar and dashboard week boundaries.
- Password hashed with bcrypt (via passlib).

---

### Table: journal_entries

Stores all three journal types in one table, differentiated by `entry_type`.

```sql
CREATE TABLE journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_type      TEXT NOT NULL
                    CHECK (entry_type IN (
                        'morning_pages', 'daily_reflection', 'weekly_review'
                    )),
    entry_date      DATE NOT NULL,
    content         JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (entry_type, entry_date)
);

CREATE INDEX idx_journal_entries_date ON journal_entries (entry_date DESC);
CREATE INDEX idx_journal_entries_type_date ON journal_entries (entry_type, entry_date DESC);
```

**Content JSONB structure by type:**

```jsonc
// morning_pages
{
    "body": "Free-form text content..."
}

// daily_reflection
{
    "went_well": "Text about what went well...",
    "to_improve": "Text about improvements...",
    "grateful_for": "Text about gratitude..."
}

// weekly_review
{
    "big_wins": "Text...",
    "challenges": "Text...",
    "learnings": "Text...",
    "next_week_focus": "Text..."
}
```

**Why JSONB instead of separate columns:**
- Each entry type has different fields.
- JSONB avoids nullable columns and keeps the schema clean.
- Single table simplifies timeline queries (one query, sorted by date).
- PostgreSQL can index JSONB fields if needed later.

**Why UNIQUE(entry_type, entry_date):**
- Prevents duplicate morning pages for the same day.
- Allows one morning_pages AND one daily_reflection on the same date.

---

### Table: exercises

Global exercise catalog. Not tied to any specific program.

```sql
CREATE TABLE exercises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    muscle_group    TEXT,
    demo_url        TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, name)
);

CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group);
```

**Notes:**
- `muscle_group` is free text (e.g., "chest", "back", "legs"). No enum -- keeps it flexible.
- `demo_url` is optional link to a video demonstration.
- `UNIQUE(user_id, name)` prevents duplicate exercise names.

---

### Table: workout_programs

Named workout programs. One can be marked as active.

```sql
CREATE TABLE workout_programs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, name)
);
```

**Notes:**
- `is_active`: Only one program should be active at a time. Enforced at the application layer (not DB constraint) to keep the logic simple -- when activating a program, deactivate all others in the same transaction.

---

### Table: program_exercises

Junction table linking exercises to programs with ordering and target sets/reps.

```sql
CREATE TABLE program_exercises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id      UUID NOT NULL REFERENCES workout_programs(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    day_label       TEXT NOT NULL,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    target_sets     SMALLINT NOT NULL DEFAULT 3
                    CHECK (target_sets BETWEEN 1 AND 20),
    target_reps_min SMALLINT NOT NULL DEFAULT 8
                    CHECK (target_reps_min BETWEEN 1 AND 100),
    target_reps_max SMALLINT NOT NULL DEFAULT 12
                    CHECK (target_reps_max BETWEEN 1 AND 100),
    rest_seconds    SMALLINT NOT NULL DEFAULT 90
                    CHECK (rest_seconds BETWEEN 0 AND 600),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (program_id, exercise_id, day_label),
    CHECK (target_reps_max >= target_reps_min)
);

CREATE INDEX idx_program_exercises_program_day
    ON program_exercises (program_id, day_label, sort_order);
```

**Notes:**
- `day_label`: Free text like "Upper Body A", "Lower Body B", "Push Day". Not tied to calendar days.
- `sort_order`: Determines exercise display order within a day.
- `ON DELETE RESTRICT` on exercise_id: Prevents deleting an exercise that is used in a program. User must remove it from programs first.
- Same exercise can appear in multiple day_labels within the same program (e.g., squats on both Lower A and Lower B).

---

### Table: workout_sessions

Records each completed (or in-progress) workout.

```sql
CREATE TABLE workout_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id      UUID REFERENCES workout_programs(id) ON DELETE SET NULL,
    day_label       TEXT,
    status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_sessions_user_date
    ON workout_sessions (user_id, started_at DESC);
CREATE INDEX idx_workout_sessions_status
    ON workout_sessions (status) WHERE status = 'in_progress';
```

**Notes:**
- `program_id` is nullable and uses `SET NULL` on delete: If a program is deleted, the historical session record remains but loses its program link.
- `day_label` is copied from the program at session creation time (denormalized). This preserves what the user actually did even if the program changes later.
- `duration_seconds` is calculated at completion time (`completed_at - started_at`).
- Partial index on `status = 'in_progress'` optimizes checking for active workouts.

---

### Table: workout_logs

Individual exercise logs within a workout session. One row per set.

```sql
CREATE TABLE workout_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id     UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    set_number      SMALLINT NOT NULL CHECK (set_number BETWEEN 1 AND 20),
    reps            SMALLINT NOT NULL CHECK (reps BETWEEN 0 AND 200),
    weight_kg       DECIMAL(6,2),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (session_id, exercise_id, set_number)
);

CREATE INDEX idx_workout_logs_session ON workout_logs (session_id);
CREATE INDEX idx_workout_logs_exercise ON workout_logs (exercise_id, created_at DESC);
```

**Notes:**
- One row per set (not per exercise). So 3 sets of pull-ups = 3 rows.
- `weight_kg` is nullable for bodyweight exercises.
- `UNIQUE(session_id, exercise_id, set_number)` prevents logging set 2 of pull-ups twice in the same session.
- The exercise_id index supports querying historical performance for a specific exercise (progression tracking in V2).

---

### Table: projects

The 3 project boards. Fixed set but stored in DB for flexibility.

```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    objective       TEXT,
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, slug)
);
```

**Notes:**
- `slug`: URL-friendly identifier (e.g., "barbania", "chaliao", "work").
- `objective`: Current objective text shown on dashboard and project board.
- Three initial rows seeded during setup: Barbania, Chaliao, Work.
- Stored in DB rather than hardcoded so user can rename or add boards in the future.

---

### Table: project_tasks

Tasks within a project, organized by status.

```sql
CREATE TABLE project_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'backlog'
                    CHECK (status IN ('in_progress', 'backlog', 'completed')),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_tasks_project_status
    ON project_tasks (project_id, status, sort_order);
CREATE INDEX idx_project_tasks_completed
    ON project_tasks (project_id, completed_at DESC)
    WHERE status = 'completed';
```

**Notes:**
- `sort_order` enables drag-and-drop reordering within a status column.
- `completed_at` is set when status changes to 'completed' (enables "Completed This Week" filtering on dashboard).
- Partial index on completed tasks optimizes the "recent completions" query.

---

### Table: project_notes

Free-text notes attached to a project.

```sql
CREATE TABLE project_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_notes_project ON project_notes (project_id, updated_at DESC);
```

**Notes:**
- Simple text notes. No rich text in V1.
- Multiple notes per project, ordered by most recently updated.

---

### Table: captures

Inbox items from manual entry or Siri Shortcuts.

```sql
CREATE TABLE captures (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    source          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual', 'siri', 'shortcut', 'api')),
    status          TEXT NOT NULL DEFAULT 'unprocessed'
                    CHECK (status IN ('unprocessed', 'processed', 'deleted')),
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_captures_status ON captures (status, created_at DESC)
    WHERE status = 'unprocessed';
```

**Notes:**
- `source` tracks where the capture came from (for display: "via Siri", "Manual entry").
- `status = 'deleted'` is a soft delete. Hard deletes happen in a cleanup job or never.
- Partial index on unprocessed captures optimizes the inbox query and dashboard count.

---

### Table: calendar_events

Events with optional weekly recurrence.

```sql
CREATE TABLE calendar_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    notes           TEXT,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,

    -- Recurrence fields (null = one-time event)
    is_recurring    BOOLEAN NOT NULL DEFAULT false,
    recurrence_rule JSONB,
    recurrence_end  DATE,
    series_id       UUID,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (end_time > start_time)
);

CREATE INDEX idx_calendar_events_time_range
    ON calendar_events (start_time, end_time);
CREATE INDEX idx_calendar_events_series
    ON calendar_events (series_id) WHERE series_id IS NOT NULL;
```

**Recurrence JSONB structure:**

```jsonc
// Weekly on Monday, Wednesday, Friday
{
    "frequency": "weekly",
    "days_of_week": [1, 3, 5]
    // 0=Sunday, 1=Monday, ... 6=Saturday
}
```

**Recurrence strategy (materialized instances):**

Instead of computing occurrences on-the-fly, the system materializes recurring events as individual rows:

1. When user creates a recurring event, the backend generates individual event rows for each occurrence up to `recurrence_end` (or 3 months ahead if "forever").
2. All instances share the same `series_id`.
3. Editing "all future events" updates all rows with the same `series_id` and `start_time >= current event`.
4. Deleting "this event only" deletes the single row.
5. Deleting "all events in series" deletes all rows with the same `series_id`.
6. A background job (or on-access check) extends "forever" recurring events by generating new instances as time progresses.

**Why materialized over computed:**
- Simpler queries: `SELECT * FROM calendar_events WHERE start_time BETWEEN x AND y` works for both one-time and recurring events.
- Supports per-instance edits (e.g., moving one occurrence of a recurring meeting).
- Avoids complex recurrence computation in the query path.
- Trade-off: More rows in the database. Acceptable for a single-user system with weekly-only recurrence.

---

### Table: api_keys

Bearer tokens for external API access (Siri Shortcuts).

```sql
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash        TEXT NOT NULL,
    key_prefix      TEXT NOT NULL,
    name            TEXT NOT NULL DEFAULT 'Shortcuts Integration',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_prefix ON api_keys (key_prefix) WHERE is_active = true;
```

**Notes:**
- The actual API key is shown to the user once at creation time, then only the hash is stored (like a password).
- `key_prefix`: First 8 characters of the key stored in plain text for identification (e.g., "sk_live_a" displayed as "sk_live_a...").
- Authentication flow: Client sends `Authorization: Bearer sk_live_abc123...`. Backend hashes the token and compares against stored `key_hash`.
- `last_used_at` updated on each successful API call (for the Settings display).

---

### Table: refresh_tokens

Stores refresh tokens for JWT session management.

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at);
```

**Notes:**
- Refresh tokens stored as hashes (same as API keys).
- `expires_at` set to 7 days from creation (matches the "session timeout after 7 days of inactivity" UX requirement).
- Old tokens cleaned up periodically.

---

## 4. DATABASE TRIGGER: AUTO-UPDATE `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_programs_updated_at
    BEFORE UPDATE ON workout_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_exercises_updated_at
    BEFORE UPDATE ON program_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at
    BEFORE UPDATE ON workout_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_notes_updated_at
    BEFORE UPDATE ON project_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_captures_updated_at
    BEFORE UPDATE ON captures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. DATA FLOW EXAMPLES

### Example 1: Dashboard Weekly Query

The dashboard needs data from every module. Here is what the `/api/v1/dashboard/weekly` endpoint queries:

```
Given: week_start = Monday Feb 16, week_end = Sunday Feb 22

1. Today's events:
   SELECT * FROM calendar_events
   WHERE start_time::date = CURRENT_DATE
   ORDER BY start_time;

2. Journal status (streak + today's entries):
   SELECT entry_type, entry_date FROM journal_entries
   WHERE entry_date >= week_start
   ORDER BY entry_date DESC;

   -- Streak calculation:
   SELECT entry_date FROM journal_entries
   WHERE entry_type = 'morning_pages'
   AND entry_date <= CURRENT_DATE
   ORDER BY entry_date DESC;
   -- Count consecutive days from today backward

3. Workout status this week:
   SELECT started_at::date as workout_date, status
   FROM workout_sessions
   WHERE started_at >= week_start AND started_at < week_end + 1
   AND status = 'completed';

   -- Next workout from active program:
   SELECT name, day_label FROM workout_programs wp
   JOIN program_exercises pe ON wp.id = pe.program_id
   WHERE wp.is_active = true
   LIMIT 1;

4. Project objectives:
   SELECT name, slug, objective,
     (SELECT count(*) FROM project_tasks pt
      WHERE pt.project_id = p.id AND pt.status = 'in_progress')
      as in_progress_count
   FROM projects p
   ORDER BY sort_order;

5. Unprocessed captures count:
   SELECT count(*) FROM captures
   WHERE status = 'unprocessed';
```

### Example 2: Starting a Workout Session

```
1. Frontend: POST /api/v1/workouts/sessions
   Body: { program_id: "...", day_label: "Upper Body A" }

2. Backend (in a transaction):
   a. Check no existing in_progress session
   b. INSERT INTO workout_sessions (user_id, program_id, day_label, status, started_at)
   c. Fetch program exercises for this day_label:
      SELECT e.id, e.name, pe.target_sets, pe.target_reps_min,
             pe.target_reps_max, pe.rest_seconds
      FROM program_exercises pe
      JOIN exercises e ON pe.exercise_id = e.id
      WHERE pe.program_id = :program_id AND pe.day_label = :day_label
      ORDER BY pe.sort_order;
   d. Return session_id + exercise list to frontend

3. Frontend: Timer starts, user logs sets

4. Frontend: POST /api/v1/workouts/sessions/:id/logs
   Body: { exercise_id: "...", set_number: 1, reps: 8, weight_kg: null }
   -- Called after each set completion

5. Frontend: PATCH /api/v1/workouts/sessions/:id/complete
   Body: { notes: "Felt strong today" }

6. Backend:
   a. UPDATE workout_sessions SET status='completed',
      completed_at=now(), duration_seconds=extract(epoch from now()-started_at),
      notes=:notes
   b. Return session summary
```

### Example 3: Creating a Recurring Calendar Event

```
1. Frontend: POST /api/v1/calendar/events
   Body: {
     title: "Team Standup",
     start_time: "2026-02-16T09:00:00Z",
     end_time: "2026-02-16T09:30:00Z",
     notes: "Daily team sync",
     is_recurring: true,
     recurrence_rule: { frequency: "weekly", days_of_week: [1, 3, 5] },
     recurrence_end: "2026-03-31"
   }

2. Backend:
   a. Generate series_id = new UUID
   b. Calculate all occurrence dates from Feb 16 to Mar 31
      that fall on Monday(1), Wednesday(3), Friday(5)
   c. For each date, INSERT a calendar_event row:
      - Same title, notes
      - start_time/end_time adjusted to that date
      - series_id = generated UUID
      - is_recurring = true
      - recurrence_rule = same JSONB
   d. Return the first event + occurrence count

3. Result: ~19 rows inserted (approx 6.5 weeks x 3 days/week)
```

---

## 6. SEED DATA

Initial data created on first setup:

```sql
-- Single user (password set during initial setup)
INSERT INTO users (username, display_name)
VALUES ('samuel', 'Samuel');

-- Three default projects
INSERT INTO projects (user_id, name, slug, sort_order) VALUES
    (:user_id, 'Barbania', 'barbania', 0),
    (:user_id, 'Chaliao', 'chaliao', 1),
    (:user_id, 'Work', 'work', 2);

-- One default API key (generated during onboarding step 3)
-- Key shown to user, hash stored in DB
INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
VALUES (:user_id, :hashed_key, 'sk_live_', 'Shortcuts Integration');
```

---

## 7. ENTITY RELATIONSHIP SUMMARY

```
users (1)
  |
  +--< journal_entries (many)
  |
  +--< exercises (many)
  |
  +--< workout_programs (many)
  |     |
  |     +--< program_exercises (many) >-- exercises
  |     |
  |     +--< workout_sessions (many)
  |           |
  |           +--< workout_logs (many) >-- exercises
  |
  +--< projects (many)
  |     |
  |     +--< project_tasks (many)
  |     |
  |     +--< project_notes (many)
  |
  +--< captures (many)
  |
  +--< calendar_events (many)
  |
  +--< api_keys (many)
  |
  +--< refresh_tokens (many)
```
