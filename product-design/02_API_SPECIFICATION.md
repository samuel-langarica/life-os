# Life OS - Technical Architecture (Part 2)
# Complete API Specification

---

## API CONVENTIONS

```
Base URL:           https://lifeos.yourdomain.com/api
API Version:        /api/v1/...  (auth endpoints unversioned at /api/auth/...)
Content-Type:       application/json
Authentication:     httpOnly cookie (browser) or Bearer token (external API)
Date format:        ISO 8601 (2026-02-16T09:00:00Z)
UUID format:        Standard UUID v4 (550e8400-e29b-41d4-a716-446655440000)
Pagination:         ?page=1&per_page=20 (default 20, max 100)
Error format:       { "detail": "Human-readable message", "code": "MACHINE_CODE" }
```

### Standard HTTP Status Codes

```
200  OK              - Successful GET, PATCH, or action
201  Created         - Successful POST that creates a resource
204  No Content      - Successful DELETE
400  Bad Request     - Invalid input (validation error)
401  Unauthorized    - Missing or invalid auth
404  Not Found       - Resource does not exist
409  Conflict        - Duplicate resource or state conflict
422  Unprocessable   - Valid JSON but semantic error
500  Internal Error  - Server error
```

### Standard Error Response

```json
{
    "detail": "Journal entry for this date and type already exists",
    "code": "DUPLICATE_ENTRY"
}
```

### Standard Pagination Response Wrapper

```json
{
    "items": [...],
    "total": 47,
    "page": 1,
    "per_page": 20,
    "pages": 3
}
```

---

## 1. AUTHENTICATION ENDPOINTS

All auth endpoints are at `/api/auth/` (unversioned).

---

### POST /api/auth/login

Authenticates user and sets JWT cookies.

**Request:**
```json
{
    "username": "samuel",
    "password": "your-password"
}
```

**Response 200:**
```json
{
    "user": {
        "id": "uuid",
        "username": "samuel",
        "display_name": "Samuel",
        "theme": "auto",
        "week_start_day": 1
    }
}
```

**Cookies set:**
```
Set-Cookie: access_token=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
Set-Cookie: refresh_token=eyJhbG...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh; Max-Age=604800
```

**Token details:**
- Access token: 15 minute expiry, contains `{ sub: user_id, exp: timestamp }`
- Refresh token: 7 day expiry, stored as hash in `refresh_tokens` table

**Response 401:**
```json
{
    "detail": "Invalid username or password",
    "code": "INVALID_CREDENTIALS"
}
```

---

### POST /api/auth/refresh

Refreshes the access token using the refresh token cookie.

**Request:** No body. Refresh token sent via cookie.

**Response 200:**
```json
{
    "message": "Token refreshed"
}
```

**Cookies set:** New access_token cookie (same format as login).

**Response 401:**
```json
{
    "detail": "Refresh token expired or invalid",
    "code": "REFRESH_TOKEN_INVALID"
}
```

---

### POST /api/auth/logout

Clears auth cookies and invalidates refresh token.

**Request:** No body.

**Response 200:**
```json
{
    "message": "Logged out"
}
```

**Cookies cleared:**
```
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth/refresh; Max-Age=0
```

---

### PATCH /api/auth/password

Changes the user's password.

**Request:**
```json
{
    "current_password": "old-password",
    "new_password": "new-password"
}
```

**Response 200:**
```json
{
    "message": "Password updated"
}
```

**Response 401:**
```json
{
    "detail": "Current password is incorrect",
    "code": "INVALID_CREDENTIALS"
}
```

---

## 2. JOURNAL ENDPOINTS

All require cookie authentication.

---

### GET /api/v1/journal/entries

List journal entries with filtering.

**Query parameters:**
```
entry_type    (optional): "morning_pages" | "daily_reflection" | "weekly_review"
date_from     (optional): "2026-02-01" (inclusive)
date_to       (optional): "2026-02-28" (inclusive)
page          (optional): 1
per_page      (optional): 20
```

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "entry_type": "morning_pages",
            "entry_date": "2026-02-16",
            "content": {
                "body": "Today I woke up thinking about..."
            },
            "created_at": "2026-02-16T07:30:00Z",
            "updated_at": "2026-02-16T07:45:00Z"
        }
    ],
    "total": 47,
    "page": 1,
    "per_page": 20,
    "pages": 3
}
```

---

### GET /api/v1/journal/entries/:id

Get a single journal entry.

**Response 200:**
```json
{
    "id": "uuid",
    "entry_type": "daily_reflection",
    "entry_date": "2026-02-16",
    "content": {
        "went_well": "Shipped the feature on time",
        "to_improve": "Took too long in meetings",
        "grateful_for": "Great weather for a walk"
    },
    "created_at": "2026-02-16T21:00:00Z",
    "updated_at": "2026-02-16T21:15:00Z"
}
```

**Response 404:**
```json
{
    "detail": "Journal entry not found",
    "code": "NOT_FOUND"
}
```

---

### POST /api/v1/journal/entries

Create a new journal entry.

**Request:**
```json
{
    "entry_type": "morning_pages",
    "entry_date": "2026-02-16",
    "content": {
        "body": "Today I woke up thinking about..."
    }
}
```

**Validation rules:**
- `entry_type`: Required. Must be one of the three types.
- `entry_date`: Required. Must be a valid date.
- `content`: Required. Must be a JSON object. Structure depends on entry_type:
  - `morning_pages`: requires `body` (string)
  - `daily_reflection`: requires `went_well`, `to_improve`, `grateful_for` (all strings)
  - `weekly_review`: requires `big_wins`, `challenges`, `learnings`, `next_week_focus` (all strings)

**Response 201:**
```json
{
    "id": "uuid",
    "entry_type": "morning_pages",
    "entry_date": "2026-02-16",
    "content": {
        "body": "Today I woke up thinking about..."
    },
    "created_at": "2026-02-16T07:30:00Z",
    "updated_at": "2026-02-16T07:30:00Z"
}
```

**Response 409:**
```json
{
    "detail": "Morning pages entry already exists for 2026-02-16",
    "code": "DUPLICATE_ENTRY"
}
```

---

### PATCH /api/v1/journal/entries/:id

Update an existing journal entry (partial update).

**Request:**
```json
{
    "content": {
        "body": "Updated text content..."
    }
}
```

**Response 200:** Full updated entry (same format as GET).

---

### DELETE /api/v1/journal/entries/:id

Delete a journal entry.

**Response 204:** No content.

---

### GET /api/v1/journal/status

Get journal status for dashboard display (streak, today's entries, this week).

**Response 200:**
```json
{
    "today": {
        "morning_pages": true,
        "daily_reflection": false
    },
    "streaks": {
        "morning_pages": 7,
        "daily_reflection": 3
    },
    "this_week": {
        "morning_pages_count": 5,
        "daily_reflection_count": 4,
        "weekly_review_done": false
    },
    "recent_entries": [
        {
            "id": "uuid",
            "entry_type": "morning_pages",
            "entry_date": "2026-02-16"
        }
    ]
}
```

---

## 3. EXERCISE ENDPOINTS

---

### GET /api/v1/exercises

List all exercises.

**Query parameters:**
```
muscle_group  (optional): "chest", "back", etc.
search        (optional): "pull" (searches name)
```

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "name": "Pull-ups",
            "muscle_group": "back",
            "demo_url": null,
            "notes": "Focus on full range of motion",
            "created_at": "2026-02-10T12:00:00Z"
        }
    ],
    "total": 15
}
```

---

### POST /api/v1/exercises

Create a new exercise.

**Request:**
```json
{
    "name": "Pull-ups",
    "muscle_group": "back",
    "demo_url": "https://youtube.com/watch?v=...",
    "notes": "Focus on full range of motion"
}
```

**Response 201:** Full exercise object.

**Response 409:**
```json
{
    "detail": "Exercise with name 'Pull-ups' already exists",
    "code": "DUPLICATE_ENTRY"
}
```

---

### PATCH /api/v1/exercises/:id

Update an exercise.

**Request (partial):**
```json
{
    "name": "Weighted Pull-ups",
    "notes": "Add 10kg plate"
}
```

**Response 200:** Full updated exercise.

---

### DELETE /api/v1/exercises/:id

Delete an exercise. Fails if exercise is used in any program.

**Response 204:** No content.

**Response 409:**
```json
{
    "detail": "Exercise is used in 2 programs. Remove it from programs first.",
    "code": "EXERCISE_IN_USE"
}
```

---

## 4. WORKOUT PROGRAM ENDPOINTS

---

### GET /api/v1/programs

List all workout programs.

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "name": "Upper/Lower Split",
            "description": "4-day split focusing on compound movements",
            "is_active": true,
            "day_labels": ["Upper Body A", "Lower Body A", "Upper Body B", "Lower Body B"],
            "exercise_count": 24,
            "created_at": "2026-02-10T12:00:00Z"
        }
    ]
}
```

---

### GET /api/v1/programs/:id

Get program with all exercises grouped by day.

**Response 200:**
```json
{
    "id": "uuid",
    "name": "Upper/Lower Split",
    "description": "4-day split focusing on compound movements",
    "is_active": true,
    "days": {
        "Upper Body A": [
            {
                "id": "program_exercise_uuid",
                "exercise": {
                    "id": "exercise_uuid",
                    "name": "Pull-ups",
                    "muscle_group": "back",
                    "demo_url": null
                },
                "sort_order": 0,
                "target_sets": 3,
                "target_reps_min": 8,
                "target_reps_max": 10,
                "rest_seconds": 90
            }
        ],
        "Lower Body A": [...]
    },
    "created_at": "2026-02-10T12:00:00Z"
}
```

---

### POST /api/v1/programs

Create a new program.

**Request:**
```json
{
    "name": "Upper/Lower Split",
    "description": "4-day split focusing on compound movements",
    "is_active": false
}
```

**Response 201:** Full program object (without exercises since it is new).

---

### PATCH /api/v1/programs/:id

Update program metadata.

**Request (partial):**
```json
{
    "name": "Updated Name",
    "is_active": true
}
```

**Side effect:** If `is_active` is set to `true`, all other programs are set to `is_active = false`.

**Response 200:** Full updated program.

---

### DELETE /api/v1/programs/:id

Delete a program and all its exercise associations. Historical workout sessions are preserved (program_id set to NULL).

**Response 204:** No content.

---

### POST /api/v1/programs/:id/exercises

Add an exercise to a program.

**Request:**
```json
{
    "exercise_id": "uuid",
    "day_label": "Upper Body A",
    "sort_order": 0,
    "target_sets": 3,
    "target_reps_min": 8,
    "target_reps_max": 10,
    "rest_seconds": 90
}
```

**Response 201:** Full program_exercise object.

---

### PATCH /api/v1/programs/:program_id/exercises/:exercise_entry_id

Update an exercise entry within a program.

**Request (partial):**
```json
{
    "sort_order": 2,
    "target_sets": 4,
    "rest_seconds": 120
}
```

**Response 200:** Full updated program_exercise.

---

### DELETE /api/v1/programs/:program_id/exercises/:exercise_entry_id

Remove an exercise from a program.

**Response 204:** No content.

---

### PUT /api/v1/programs/:id/exercises/reorder

Reorder exercises within a day.

**Request:**
```json
{
    "day_label": "Upper Body A",
    "exercise_order": [
        "program_exercise_uuid_1",
        "program_exercise_uuid_2",
        "program_exercise_uuid_3"
    ]
}
```

**Response 200:**
```json
{
    "message": "Exercises reordered"
}
```

---

## 5. WORKOUT SESSION ENDPOINTS

---

### POST /api/v1/workouts/sessions

Start a new workout session.

**Request:**
```json
{
    "program_id": "uuid",
    "day_label": "Upper Body A"
}
```

**Validation:**
- Fails if there is already an `in_progress` session.

**Response 201:**
```json
{
    "id": "session_uuid",
    "program_id": "uuid",
    "program_name": "Upper/Lower Split",
    "day_label": "Upper Body A",
    "status": "in_progress",
    "started_at": "2026-02-16T18:00:00Z",
    "exercises": [
        {
            "exercise_id": "uuid",
            "name": "Pull-ups",
            "target_sets": 3,
            "target_reps_min": 8,
            "target_reps_max": 10,
            "rest_seconds": 90,
            "sort_order": 0
        }
    ]
}
```

**Response 409:**
```json
{
    "detail": "A workout session is already in progress",
    "code": "SESSION_IN_PROGRESS"
}
```

---

### GET /api/v1/workouts/sessions/active

Get the currently active (in_progress) session, if any.

**Response 200:**
```json
{
    "id": "session_uuid",
    "program_name": "Upper/Lower Split",
    "day_label": "Upper Body A",
    "status": "in_progress",
    "started_at": "2026-02-16T18:00:00Z",
    "exercises": [...],
    "logged_sets": [
        {
            "exercise_id": "uuid",
            "set_number": 1,
            "reps": 8,
            "weight_kg": null
        }
    ]
}
```

**Response 404:**
```json
{
    "detail": "No active workout session",
    "code": "NOT_FOUND"
}
```

---

### POST /api/v1/workouts/sessions/:id/logs

Log a set during a workout.

**Request:**
```json
{
    "exercise_id": "uuid",
    "set_number": 1,
    "reps": 8,
    "weight_kg": null
}
```

**Response 201:**
```json
{
    "id": "log_uuid",
    "session_id": "session_uuid",
    "exercise_id": "uuid",
    "set_number": 1,
    "reps": 8,
    "weight_kg": null,
    "created_at": "2026-02-16T18:05:00Z"
}
```

---

### PATCH /api/v1/workouts/sessions/:id/complete

Complete a workout session.

**Request:**
```json
{
    "notes": "Felt strong today"
}
```

**Response 200:**
```json
{
    "id": "session_uuid",
    "program_name": "Upper/Lower Split",
    "day_label": "Upper Body A",
    "status": "completed",
    "started_at": "2026-02-16T18:00:00Z",
    "completed_at": "2026-02-16T18:42:00Z",
    "duration_seconds": 2520,
    "notes": "Felt strong today",
    "summary": [
        {
            "exercise_name": "Pull-ups",
            "sets_completed": 3,
            "reps_per_set": [8, 8, 7]
        }
    ]
}
```

---

### PATCH /api/v1/workouts/sessions/:id/cancel

Cancel / discard a workout session.

**Response 200:**
```json
{
    "id": "session_uuid",
    "status": "cancelled",
    "message": "Workout session cancelled"
}
```

---

### GET /api/v1/workouts/history

Get completed workout history.

**Query parameters:**
```
page        (optional): 1
per_page    (optional): 20
date_from   (optional): "2026-01-01"
date_to     (optional): "2026-02-28"
```

**Response 200:**
```json
{
    "items": [
        {
            "id": "session_uuid",
            "program_name": "Upper/Lower Split",
            "day_label": "Upper Body A",
            "status": "completed",
            "started_at": "2026-02-16T18:00:00Z",
            "completed_at": "2026-02-16T18:42:00Z",
            "duration_seconds": 2520,
            "exercise_count": 6
        }
    ],
    "total": 24,
    "page": 1,
    "per_page": 20,
    "pages": 2
}
```

---

### GET /api/v1/workouts/history/:id

Get details of a specific completed workout.

**Response 200:** Same format as the complete response from PATCH .../complete.

---

## 6. PROJECT ENDPOINTS

---

### GET /api/v1/projects

List all projects with task counts.

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "name": "Barbania",
            "slug": "barbania",
            "objective": "Ship prototype v0.1",
            "sort_order": 0,
            "task_counts": {
                "in_progress": 3,
                "backlog": 5,
                "completed": 12
            }
        }
    ]
}
```

---

### GET /api/v1/projects/:slug

Get a single project with all tasks and notes.

**Response 200:**
```json
{
    "id": "uuid",
    "name": "Barbania",
    "slug": "barbania",
    "objective": "Ship prototype v0.1",
    "tasks": {
        "in_progress": [
            {
                "id": "uuid",
                "title": "Design onboarding flow",
                "status": "in_progress",
                "sort_order": 0,
                "created_at": "2026-02-10T12:00:00Z"
            }
        ],
        "backlog": [...],
        "completed": [
            {
                "id": "uuid",
                "title": "Finalize color scheme",
                "status": "completed",
                "sort_order": 0,
                "completed_at": "2026-02-15T14:00:00Z",
                "created_at": "2026-02-08T10:00:00Z"
            }
        ]
    },
    "notes": [
        {
            "id": "uuid",
            "content": "Focus on core features first. Avoid feature creep.",
            "created_at": "2026-02-10T12:00:00Z",
            "updated_at": "2026-02-14T09:00:00Z"
        }
    ]
}
```

**Note:** Completed tasks are returned with most recent first, limited to the last 50. Use the dedicated completed tasks endpoint for pagination.

---

### PATCH /api/v1/projects/:slug

Update project metadata (name, objective).

**Request:**
```json
{
    "objective": "Ship prototype v0.2"
}
```

**Response 200:** Full project object (without tasks/notes).

---

### POST /api/v1/projects/:slug/tasks

Create a task in a project.

**Request:**
```json
{
    "title": "Build user authentication",
    "status": "in_progress"
}
```

**Response 201:**
```json
{
    "id": "uuid",
    "project_id": "uuid",
    "title": "Build user authentication",
    "status": "in_progress",
    "sort_order": 3,
    "completed_at": null,
    "created_at": "2026-02-16T10:00:00Z"
}
```

---

### PATCH /api/v1/projects/:slug/tasks/:task_id

Update a task (title, status, sort_order).

**Request (partial):**
```json
{
    "status": "completed"
}
```

**Side effect:** If status changes to `completed`, `completed_at` is set to `now()`. If status changes from `completed` to something else, `completed_at` is set to `null`.

**Response 200:** Full updated task.

---

### DELETE /api/v1/projects/:slug/tasks/:task_id

Delete a task.

**Response 204:** No content.

---

### PUT /api/v1/projects/:slug/tasks/reorder

Reorder tasks within a status column.

**Request:**
```json
{
    "status": "in_progress",
    "task_order": ["uuid_1", "uuid_2", "uuid_3"]
}
```

**Response 200:**
```json
{
    "message": "Tasks reordered"
}
```

---

### PUT /api/v1/projects/:slug/tasks/:task_id/move

Move a task to a different status (drag-and-drop between columns).

**Request:**
```json
{
    "new_status": "backlog",
    "sort_order": 2
}
```

**Response 200:** Full updated task.

---

### DELETE /api/v1/projects/:slug/tasks/completed

Clear all completed tasks for a project.

**Response 200:**
```json
{
    "deleted_count": 23
}
```

---

### POST /api/v1/projects/:slug/notes

Create a note on a project.

**Request:**
```json
{
    "content": "Focus on core features first."
}
```

**Response 201:** Full note object.

---

### PATCH /api/v1/projects/:slug/notes/:note_id

Update a project note.

**Request:**
```json
{
    "content": "Updated note content."
}
```

**Response 200:** Full updated note.

---

### DELETE /api/v1/projects/:slug/notes/:note_id

Delete a project note.

**Response 204:** No content.

---

## 7. CAPTURES ENDPOINTS

### Cookie-authenticated endpoints (browser):

---

### GET /api/v1/captures

List captures (inbox).

**Query parameters:**
```
status      (optional): "unprocessed" (default) | "processed" | "all"
page        (optional): 1
per_page    (optional): 50
```

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "text": "Follow up with Sarah about Q1 budget",
            "source": "siri",
            "status": "unprocessed",
            "created_at": "2026-02-16T14:23:00Z"
        }
    ],
    "total": 3,
    "page": 1,
    "per_page": 50,
    "pages": 1
}
```

---

### POST /api/v1/captures

Create a capture (manual, from within the app).

**Request:**
```json
{
    "text": "Research new protein powder brands"
}
```

**Response 201:**
```json
{
    "id": "uuid",
    "text": "Research new protein powder brands",
    "source": "manual",
    "status": "unprocessed",
    "created_at": "2026-02-16T15:00:00Z"
}
```

---

### PATCH /api/v1/captures/:id

Update a capture (mark as processed).

**Request:**
```json
{
    "status": "processed"
}
```

**Response 200:** Full updated capture.

---

### DELETE /api/v1/captures/:id

Hard delete a capture.

**Response 204:** No content.

---

### GET /api/v1/captures/count

Get unprocessed capture count (for badge display).

**Response 200:**
```json
{
    "unprocessed_count": 3
}
```

---

### External API endpoint (Bearer token auth):

### POST /api/v1/captures/external

Create a capture from external source (Siri Shortcuts).

**Authentication:** `Authorization: Bearer YOUR_API_KEY_HERE`

**Request:**
```json
{
    "text": "Follow up with Sarah about Q1 budget",
    "source": "siri"
}
```

**Response 201:**
```json
{
    "id": "uuid",
    "text": "Follow up with Sarah about Q1 budget",
    "source": "siri",
    "status": "unprocessed",
    "created_at": "2026-02-16T14:23:00Z"
}
```

**Response 401:**
```json
{
    "detail": "Invalid API key",
    "code": "UNAUTHORIZED"
}
```

**Response 400:**
```json
{
    "detail": "Text is required and must not be empty",
    "code": "VALIDATION_ERROR"
}
```

---

## 8. CALENDAR ENDPOINTS

---

### GET /api/v1/calendar/events

Get events for a date range (used by week view).

**Query parameters:**
```
start_date  (required): "2026-02-16"  (inclusive)
end_date    (required): "2026-02-22"  (inclusive)
```

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "title": "Team Standup",
            "notes": "Daily team sync",
            "start_time": "2026-02-16T09:00:00Z",
            "end_time": "2026-02-16T09:30:00Z",
            "is_recurring": true,
            "series_id": "series_uuid",
            "recurrence_rule": {
                "frequency": "weekly",
                "days_of_week": [1, 3, 5]
            },
            "recurrence_end": "2026-03-31"
        },
        {
            "id": "uuid2",
            "title": "Project Review",
            "notes": null,
            "start_time": "2026-02-16T14:00:00Z",
            "end_time": "2026-02-16T15:00:00Z",
            "is_recurring": false,
            "series_id": null,
            "recurrence_rule": null,
            "recurrence_end": null
        }
    ]
}
```

**Note:** Returns all materialized event instances within the date range. No pagination needed -- a single week will have at most ~50 events for a single user.

---

### GET /api/v1/calendar/events/:id

Get a single event.

**Response 200:** Single event object (same format as list item).

---

### POST /api/v1/calendar/events

Create an event (one-time or recurring).

**Request (one-time):**
```json
{
    "title": "Project Review",
    "start_time": "2026-02-16T14:00:00Z",
    "end_time": "2026-02-16T15:00:00Z",
    "notes": "Prepare slides"
}
```

**Request (recurring):**
```json
{
    "title": "Team Standup",
    "start_time": "2026-02-16T09:00:00Z",
    "end_time": "2026-02-16T09:30:00Z",
    "notes": "Daily team sync",
    "is_recurring": true,
    "recurrence_rule": {
        "frequency": "weekly",
        "days_of_week": [1, 3, 5]
    },
    "recurrence_end": "2026-03-31"
}
```

**Response 201 (one-time):**
```json
{
    "id": "uuid",
    "title": "Project Review",
    "start_time": "2026-02-16T14:00:00Z",
    "end_time": "2026-02-16T15:00:00Z",
    "notes": "Prepare slides",
    "is_recurring": false,
    "series_id": null
}
```

**Response 201 (recurring):**
```json
{
    "id": "uuid_of_first_occurrence",
    "title": "Team Standup",
    "start_time": "2026-02-16T09:00:00Z",
    "end_time": "2026-02-16T09:30:00Z",
    "is_recurring": true,
    "series_id": "series_uuid",
    "occurrences_created": 19
}
```

---

### PATCH /api/v1/calendar/events/:id

Update a single event instance.

**Request (partial):**
```json
{
    "title": "Team Standup (Updated)",
    "start_time": "2026-02-16T09:15:00Z",
    "end_time": "2026-02-16T09:45:00Z"
}
```

**Response 200:** Full updated event.

---

### PATCH /api/v1/calendar/events/:id/series

Update all future events in a series (from this event onward).

**Request:**
```json
{
    "title": "Team Standup (New Time)",
    "start_time": "2026-02-18T10:00:00Z",
    "end_time": "2026-02-18T10:30:00Z",
    "apply_to": "future"
}
```

**`apply_to` options:**
- `"future"`: This event and all future events in the series.
- `"all"`: All events in the series.

**Response 200:**
```json
{
    "updated_count": 12,
    "series_id": "series_uuid"
}
```

---

### DELETE /api/v1/calendar/events/:id

Delete a single event or recurring series.

**Query parameters:**
```
scope  (optional): "single" (default) | "future" | "all"
```

- `scope=single`: Delete only this event instance.
- `scope=future`: Delete this event and all future events in the series.
- `scope=all`: Delete all events in the series.

**Response 200:**
```json
{
    "deleted_count": 1
}
```

or for series:
```json
{
    "deleted_count": 19,
    "series_id": "series_uuid"
}
```

---

## 9. DASHBOARD ENDPOINT

---

### GET /api/v1/dashboard/weekly

Aggregated data for the weekly command center dashboard.

**Query parameters:**
```
week_of  (optional): "2026-02-16" (any date within the desired week; defaults to current week)
```

**Response 200:**
```json
{
    "week": {
        "start": "2026-02-16",
        "end": "2026-02-22",
        "week_number": 8
    },
    "greeting": {
        "time_of_day": "morning",
        "display_name": "Samuel",
        "date_display": "Monday, Feb 16"
    },
    "pending_actions": [
        {
            "type": "morning_pages",
            "message": "Morning Pages not written today",
            "action_url": "/journal/new?type=morning_pages"
        }
    ],
    "today_events": [
        {
            "id": "uuid",
            "title": "Team Standup",
            "start_time": "2026-02-16T09:00:00Z",
            "end_time": "2026-02-16T09:30:00Z",
            "is_recurring": true
        }
    ],
    "workouts": {
        "this_week": {
            "mon": true,
            "tue": false,
            "wed": false,
            "thu": false,
            "fri": false,
            "sat": false,
            "sun": false
        },
        "active_program": {
            "id": "uuid",
            "name": "Upper/Lower Split",
            "next_day_label": "Lower Body A",
            "next_suggested_date": "Wednesday"
        },
        "active_session": null
    },
    "journal": {
        "today": {
            "morning_pages": true,
            "daily_reflection": false
        },
        "streaks": {
            "morning_pages": 7,
            "daily_reflection": 3
        },
        "weekly_review_due": "2026-02-22",
        "weekly_review_done": false
    },
    "projects": [
        {
            "id": "uuid",
            "name": "Barbania",
            "slug": "barbania",
            "objective": "Ship prototype v0.1",
            "in_progress_count": 3
        }
    ],
    "captures": {
        "unprocessed_count": 3
    }
}
```

---

## 10. SETTINGS / API KEY ENDPOINTS

---

### GET /api/v1/settings

Get user settings.

**Response 200:**
```json
{
    "display_name": "Samuel",
    "theme": "auto",
    "week_start_day": 1
}
```

---

### PATCH /api/v1/settings

Update user settings.

**Request (partial):**
```json
{
    "theme": "dark",
    "week_start_day": 0
}
```

**Response 200:** Full settings object.

---

### GET /api/v1/settings/api-keys

List API keys (shows prefix only, not the full key).

**Response 200:**
```json
{
    "items": [
        {
            "id": "uuid",
            "name": "Shortcuts Integration",
            "key_prefix": "sk_live_a",
            "is_active": true,
            "last_used_at": "2026-02-16T14:23:00Z",
            "created_at": "2026-02-10T12:00:00Z"
        }
    ]
}
```

---

### POST /api/v1/settings/api-keys

Generate a new API key. The full key is returned ONLY in this response.

**Request:**
```json
{
    "name": "Shortcuts Integration"
}
```

**Response 201:**
```json
{
    "id": "uuid",
    "name": "Shortcuts Integration",
    "key": "sk_live_EXAMPLE_KEY_DO_NOT_USE",
    "key_prefix": "sk_live_E",
    "message": "Save this key now. It will not be shown again."
}
```

---

### DELETE /api/v1/settings/api-keys/:id

Revoke an API key.

**Response 204:** No content.

---

### POST /api/v1/settings/export

Export all user data as JSON.

**Response 200:**
```json
{
    "export_date": "2026-02-16T12:00:00Z",
    "user": {...},
    "journal_entries": [...],
    "exercises": [...],
    "workout_programs": [...],
    "workout_sessions": [...],
    "projects": [...],
    "captures": [...],
    "calendar_events": [...]
}
```

Content-Disposition header set for file download.
