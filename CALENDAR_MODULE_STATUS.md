# Calendar Module Implementation Status

## Completed ✅

### Backend (100% Complete)

1. **Database Model** (`backend/app/models/calendar.py`)
   - CalendarEvent model with all required fields
   - Support for recurring events (weekly pattern)
   - Series ID for grouping recurring event instances
   - Proper relationships with User model

2. **Pydantic Schemas** (`backend/app/schemas/calendar.py`)
   - CalendarEventBase, CalendarEventCreate, CalendarEventUpdate
   - CalendarEventResponse, CalendarEventListResponse
   - Full validation and serialization

3. **Repository Layer** (`backend/app/repositories/calendar.py`)
   - CRUD operations for calendar events
   - Date range queries
   - Series-based queries for recurring events
   - Batch delete operations

4. **Service Layer** (`backend/app/services/calendar.py`)
   - Smart event creation (single vs recurring)
   - Recurring event materialization (creates all instances)
   - Update with scope support (single/future/all)
   - Delete with scope support (single/future/all)

5. **API Routes** (`backend/app/api/v1/calendar.py`)
   - GET /api/v1/calendar/events - List events in date range
   - POST /api/v1/calendar/events - Create event
   - GET /api/v1/calendar/events/{id} - Get specific event
   - PATCH /api/v1/calendar/events/{id} - Update event
   - DELETE /api/v1/calendar/events/{id} - Delete event
   - All endpoints support recurring event scoping

6. **Database Migration**
   - Migration created and applied: `8b0b57f0b861_add_calendar_events_table`
   - calendar_events table created in PostgreSQL

7. **Router Integration**
   - Calendar router mounted in main.py
   - Available at /api/v1/calendar/*

8. **Frontend API Client** (`frontend/src/lib/api/calendar.ts`)
   - TypeScript interfaces for CalendarEvent
   - Complete API client with all CRUD methods
   - Support for update/delete scopes

## In Progress 🚧

### Frontend UI (0% Complete)

The frontend implementation requires building the following components:

### 1. Calendar Page (`frontend/src/app/(authenticated)/calendar/page.tsx`)

**Requirements:**
- Weekly view showing 7 days (Mon-Sun)
- Week navigation (previous/next week buttons)
- Display events in chronological order per day
- Click event to view/edit details
- [+ Add Event] button to create new events
- Responsive design (mobile: single day view with swipe, desktop: full week)

**Suggested Implementation:**
```typescript
'use client';

import { useState } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { EventModal } from '@/components/calendar/EventModal';
import { CalendarEvent } from '@/lib/api/calendar';

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(getWeekDates(new Date()));
  const { events, isLoading } = useCalendarEvents(currentWeek.start, currentWeek.end);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Week navigation
  const goToPreviousWeek = () => { /* ... */ };
  const goToNextWeek = () => { /* ... */ };

  return (
    <div className="calendar-page">
      {/* Week header with navigation */}
      <header>
        <button onClick={goToPreviousWeek}>← Previous</button>
        <h2>Week of {formatWeekRange(currentWeek)}</h2>
        <button onClick={goToNextWeek}>Next →</button>
      </header>

      {/* 7-day grid */}
      <div className="week-grid">
        {currentWeek.days.map(day => (
          <div key={day} className="day-column">
            <div className="day-header">{formatDay(day)}</div>
            <div className="events">
              {getEventsForDay(events, day).map(event => (
                <div 
                  key={event.id} 
                  className="event-card"
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowModal(true);
                  }}
                >
                  <div className="time">{formatTime(event.start_time)}</div>
                  <div className="title">{event.title}</div>
                  {event.is_recurring && <span className="recurring-icon">🔁</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add event button */}
      <button 
        className="add-event-btn"
        onClick={() => {
          setSelectedEvent(null);
          setShowModal(true);
        }}
      >
        + Add Event
      </button>

      {/* Event modal */}
      {showModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            // Refetch events
          }}
        />
      )}
    </div>
  );
}
```

### 2. Event Modal Component (`frontend/src/components/calendar/EventModal.tsx`)

**Requirements:**
- Create/edit event form
- Title input (required)
- Description textarea (optional)
- Date picker
- Start time / End time pickers
- Checkbox: "Repeat this event"
- If recurring:
  - Pattern: Weekly (hardcoded for V1)
  - Days of week: Mon/Tue/Wed/Thu/Fri/Sat/Sun checkboxes
  - End date picker
- Save button
- If editing recurring: Show scope options (this event / future / all)

**Suggested Implementation:**
```typescript
'use client';

import { useState } from 'react';
import { calendarApi, CalendarEvent } from '@/lib/api/calendar';

interface EventModalProps {
  event?: CalendarEvent | null;
  onClose: () => void;
  onSave: () => void;
}

export function EventModal({ event, onClose, onSave }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date || '',
    start_time: event?.start_time || '09:00',
    end_time: event?.end_time || '10:00',
    is_recurring: event?.is_recurring || false,
    recurrence_days: [] as number[],
    recurrence_end_date: event?.recurrence_end_date || '',
  });

  const [updateScope, setUpdateScope] = useState<'single' | 'future' | 'all'>('single');

  const handleSubmit = async () => {
    if (event) {
      // Update existing event
      await calendarApi.update(event.id, formData, updateScope);
    } else {
      // Create new event
      await calendarApi.create(formData);
    }
    onSave();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{event ? 'Edit Event' : 'New Event'}</h2>
        
        <input
          type="text"
          placeholder="Event title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <input
          type="date"
          value={formData.event_date}
          onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
        />

        <div className="time-inputs">
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
          <span>to</span>
          <input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>

        <label>
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
          />
          Repeat this event
        </label>

        {formData.is_recurring && (
          <div className="recurring-options">
            <label>Pattern: Weekly</label>
            
            <div className="days-of-week">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    value={idx + 1}
                    checked={formData.recurrence_days.includes(idx + 1)}
                    onChange={(e) => {
                      const dayNum = idx + 1;
                      setFormData({
                        ...formData,
                        recurrence_days: e.target.checked
                          ? [...formData.recurrence_days, dayNum]
                          : formData.recurrence_days.filter(d => d !== dayNum)
                      });
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>

            <input
              type="date"
              placeholder="End date"
              value={formData.recurrence_end_date}
              onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
            />
          </div>
        )}

        {event?.is_recurring && (
          <div className="update-scope">
            <label>Apply changes to:</label>
            <select value={updateScope} onChange={(e) => setUpdateScope(e.target.value as any)}>
              <option value="single">This event only</option>
              <option value="future">This and future events</option>
              <option value="all">All events in series</option>
            </select>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Custom Hook (`frontend/src/hooks/useCalendar.ts`)

```typescript
import useSWR from 'swr';
import { calendarApi } from '@/lib/api/calendar';

export function useCalendarEvents(startDate: string, endDate: string) {
  const { data, error, mutate } = useSWR(
    ['/api/v1/calendar/events', startDate, endDate],
    () => calendarApi.list(startDate, endDate)
  );

  return {
    events: data?.events || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

### 4. Calendar Widget for Dashboard (`frontend/src/components/dashboard/CalendarWidget.tsx`)

**Requirements:**
- Display "📅 This Week"
- Show current week date range
- List next 3-5 upcoming events
- "View Full Week →" link to /calendar

**Suggested Implementation:**
```typescript
'use client';

import Link from 'next/link';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { getWeekDates, formatDate, formatTime } from '@/lib/utils';

export function CalendarWidget() {
  const week = getWeekDates(new Date());
  const { events, isLoading } = useCalendarEvents(week.start, week.end);

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date())
    .slice(0, 5);

  return (
    <div className="calendar-widget">
      <h3>📅 This Week</h3>
      <p className="week-range">{formatWeekRange(week)}</p>

      {isLoading ? (
        <p>Loading...</p>
      ) : upcomingEvents.length === 0 ? (
        <p className="empty-state">No upcoming events</p>
      ) : (
        <ul className="event-list">
          {upcomingEvents.map(event => (
            <li key={event.id}>
              <div className="event-time">{formatTime(event.start_time)}</div>
              <div className="event-title">{event.title}</div>
              {event.is_recurring && <span className="recurring-badge">🔁</span>}
            </li>
          ))}
        </ul>
      )}

      <Link href="/calendar" className="view-all-link">
        View Full Week →
      </Link>
    </div>
  );
}
```

### 5. Utility Functions (`frontend/src/lib/utils.ts`)

Add these date/time utility functions:

```typescript
export function getWeekDates(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day.toISOString().split('T')[0]);
  }

  return {
    start: days[0],
    end: days[6],
    days,
  };
}

export function formatWeekRange(week: { start: string; end: string }) {
  const start = new Date(week.start);
  const end = new Date(week.end);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function formatTime(timeStr: string) {
  // Convert "09:00:00" or "09:00" to "9:00 AM"
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getEventsForDay(events: CalendarEvent[], day: string) {
  return events.filter(e => e.event_date === day).sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );
}
```

## Testing Checklist

Once frontend is complete, test these scenarios:

- [ ] Create single event
- [ ] Create recurring event (Mon/Wed/Fri)
- [ ] Edit single event
- [ ] Edit recurring event (this event only)
- [ ] Edit recurring event (future events)
- [ ] Edit recurring event (all events)
- [ ] Delete single event
- [ ] Delete recurring event (this event only)
- [ ] Delete recurring event (future events)
- [ ] Delete recurring event (all events)
- [ ] View week with multiple events
- [ ] Navigate weeks (previous/next)
- [ ] Dashboard widget shows upcoming events
- [ ] Responsive design (mobile/desktop)

## Next Steps

1. Create the frontend components listed above
2. Add calendar route to Next.js app directory
3. Integrate CalendarWidget into dashboard
4. Style components with Tailwind CSS
5. Test all CRUD operations
6. Test recurring event functionality
7. Deploy and verify in production

## API Documentation

Full API available at: `/api/docs` (when DEBUG=true)

All endpoints support cookie authentication via httpOnly cookies.
