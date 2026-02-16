# Journal Module - Architecture Overview

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         JOURNAL MODULE                              │
│                     (Complete Implementation)                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Pages (6):                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ Journal Hub    │  │ Morning Pages  │  │ Daily Reflect. │       │
│  │ /journal       │  │ /morning-pages │  │ /reflection    │       │
│  │ - Status       │  │ - Auto-save    │  │ - 3 prompts    │       │
│  │ - Streaks      │  │ - Full screen  │  │ - Save button  │       │
│  │ - Quick links  │  │ - Char count   │  │ - Structured   │       │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ Weekly Review  │  │ Timeline       │  │ Dashboard      │       │
│  │ /weekly-review │  │ /timeline      │  │ Widget         │       │
│  │ - 4 prompts    │  │ - All entries  │  │ - Streaks      │       │
│  │ - Week start   │  │ - Filter type  │  │ - Status       │       │
│  │ - Save button  │  │ - Group month  │  │ - Quick write  │       │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                      │
│  API Client:                                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ /lib/api/journal.ts                                          │  │
│  │ - list(), create(), get(), update(), delete(), getStatus()  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │
                                   HTTP/JSON
                                       │
┌──────────────────────────────────────┴──────────────────────────────┐
│                            BACKEND API                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Routes (7 endpoints):                                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ GET    /api/v1/journal/entries                              │  │
│  │ POST   /api/v1/journal/entries                              │  │
│  │ GET    /api/v1/journal/entries/{id}                         │  │
│  │ GET    /api/v1/journal/entries/type/{type}/date/{date}      │  │
│  │ PATCH  /api/v1/journal/entries/{id}                         │  │
│  │ DELETE /api/v1/journal/entries/{id}                         │  │
│  │ GET    /api/v1/journal/status                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                       │
│  Service Layer (app/services/journal.py):                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ - Business logic                                             │  │
│  │ - Duplicate checking                                         │  │
│  │ - Streak calculation                                         │  │
│  │ - Weekly progress                                            │  │
│  │ - Error handling                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                       │
│  Repository Layer (app/repositories/journal.py):                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ - Database operations (CRUD)                                 │  │
│  │ - Query building                                             │  │
│  │ - Date range filtering                                       │  │
│  │ - Streak calculation                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              ↓                                       │
│  Models (app/models/journal.py):                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ JournalEntry                                                 │  │
│  │ - id: UUID                                                   │  │
│  │ - user_id: UUID                                              │  │
│  │ - entry_type: str (morning_pages/daily_reflection/weekly_   │  │
│  │               review)                                        │  │
│  │ - entry_date: date                                           │  │
│  │ - content: dict (JSONB)                                      │  │
│  │ - created_at, updated_at: datetime                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────┬──────────────────────────────┘
                                       │
                                  PostgreSQL
                                       │
┌──────────────────────────────────────┴──────────────────────────────┐
│                            DATABASE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Table: journal_entries                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ PRIMARY KEY: id (UUID)                                       │  │
│  │ FOREIGN KEY: user_id → users.id (CASCADE)                    │  │
│  │ UNIQUE: (user_id, entry_type, entry_date)                    │  │
│  │ INDEX: (entry_date DESC)                                     │  │
│  │ INDEX: (entry_type, entry_date DESC)                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Content Structure (JSONB):                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ morning_pages:    { "content": "text" }                      │  │
│  │ daily_reflection: { "went_well": "...",                      │  │
│  │                     "improve": "...",                        │  │
│  │                     "grateful": "..." }                      │  │
│  │ weekly_review:    { "wins": "...",                           │  │
│  │                     "challenges": "...",                     │  │
│  │                     "learnings": "...",                      │  │
│  │                     "focus": "..." }                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Creating an Entry

```
1. User writes in Morning Pages editor
   ↓
2. Auto-save triggers after 2 seconds
   ↓
3. Frontend: journalApi.create() or .update()
   ↓
4. HTTP POST/PATCH → /api/v1/journal/entries
   ↓
5. Router validates auth (get_current_user)
   ↓
6. Pydantic schema validates request body
   ↓
7. Service: create_entry() or update_entry()
   ├─ Checks for duplicates (create only)
   └─ Calls repository
   ↓
8. Repository: create() or update()
   ├─ Creates/updates SQLAlchemy model
   ├─ Commits to database
   └─ Returns entry
   ↓
9. Response serialized via Pydantic
   ↓
10. Frontend receives JournalEntry object
    ↓
11. SWR updates cache
    ↓
12. UI shows "Saved ✓"
```

## Streak Calculation Flow

```
1. User requests /api/v1/journal/status
   ↓
2. Service: get_journal_status()
   ↓
3. Calls repository.calculate_streak() for each type
   ↓
4. Algorithm:
   ├─ Start from today
   ├─ Check if entry exists for date
   ├─ If yes: increment counter, check yesterday
   ├─ If no: break loop
   └─ Return count
   ↓
5. Response includes:
   {
     "morning_pages_streak": 7,
     "daily_reflection_streak": 3,
     "entries_this_week": 9,
     "weekly_review_completed": true
   }
   ↓
6. Frontend displays streaks with 🔥 emoji
```

## Component Hierarchy (Frontend)

```
Dashboard
└─ WeeklyDashboard
   └─ JournalWidget
      ├─ Morning Pages Status (✓/○)
      │  └─ Streak: 🔥 7 days
      ├─ Daily Reflection Status (✓/○)
      │  └─ Streak: 🔥 3 days
      └─ This Week Summary
         └─ 9 entries

Journal Hub (/journal)
├─ Today's Status Cards
│  ├─ Morning Pages Card
│  │  └─ [Write Now] or [Read Entry]
│  └─ Daily Reflection Card
│     └─ [Write Now] or [Read Entry]
├─ This Week Summary
│  ├─ Entries count
│  └─ Weekly Review status
└─ Recent Entries List
   └─ Links to Timeline

Morning Pages (/journal/morning-pages)
├─ Header (date, char count, save status)
├─ Full-screen textarea
└─ Auto-save on typing (2s debounce)

Daily Reflection (/journal/reflection)
├─ Header (date)
├─ 3 Structured Prompts
│  ├─ What went well?
│  ├─ What could improve?
│  └─ What am I grateful for?
└─ [Save Reflection] button

Weekly Review (/journal/weekly-review)
├─ Header (week of date)
├─ 4 Structured Prompts
│  ├─ Big wins?
│  ├─ Challenges?
│  ├─ Key learnings?
│  └─ Focus for next week?
└─ [Save Review] button

Timeline (/journal/timeline)
├─ Filter buttons (All/Morning/Reflection/Review)
└─ Entries grouped by month
   └─ Entry cards with preview
```

## Error Handling

```
Frontend Errors:
├─ Network error → Retry, show error message
├─ Validation error → Show field-specific errors
├─ Auto-save failure → Show "Error saving", retain content
└─ 401 Unauthorized → Redirect to login

Backend Errors:
├─ DuplicateEntryError (409) → "Entry already exists for this date"
├─ NotFoundError (404) → "Journal entry not found"
├─ ValidationError (422) → "Invalid entry data"
└─ General errors (500) → "An error occurred"
```

## Color Coding

```
Morning Pages:   🌅  Purple  #8B5CF6  Light: #F3E8FF
Daily Reflection: 🌙  Blue    #2563EB  Light: #DBEAFE
Weekly Review:   📝  Green   #10B981  Light: #D1FAE5
Streak Fire:     🔥  Orange  #F97316
Success:         ✓   Green   #10B981
Pending:         ○   Gray    #9CA3AF
```

## Key Design Decisions

1. **JSONB for content** - Flexible structure per entry type
2. **Unique constraint** - One entry per type per day enforced at DB level
3. **Auto-save** - Only for morning pages (long-form writing)
4. **Structured forms** - For reflections and reviews (guided prompts)
5. **Streak calculation** - Backwards from today, stops at first gap
6. **Color coding** - Visual distinction between entry types
7. **SWR caching** - Automatic cache invalidation and revalidation
8. **Relationship** - User has many journal entries (cascade delete)

## Performance Considerations

1. **Indexes** - On entry_date and (entry_type, entry_date) for fast queries
2. **Pagination** - Limit 50 entries by default (configurable up to 200)
3. **SWR caching** - Reduces API calls
4. **Auto-save debounce** - Prevents excessive API calls while typing
5. **Optimistic updates** - UI updates before API confirms

## Security

1. **Authentication** - All endpoints require valid user session
2. **Authorization** - Users can only access their own entries
3. **Validation** - Pydantic schemas validate all inputs
4. **SQL Injection** - Protected by SQLAlchemy ORM
5. **XSS Protection** - React escapes all rendered content
