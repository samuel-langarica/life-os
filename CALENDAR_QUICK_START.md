# Calendar Module - Quick Start Guide

## 🚀 Start the Application

### 1. Start Backend (Terminal 1)

```bash
cd /Users/samuel/life-os/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. Start Frontend (Terminal 2)

```bash
cd /Users/samuel/life-os/frontend
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

### 3. Open Browser

Navigate to: **http://localhost:3000**

---

## 📅 Testing the Calendar

### Test Flow 1: View Calendar

1. **Navigate to Calendar**
   - Click "📅 Calendar" in the sidebar
   - Or go to http://localhost:3000/calendar

2. **Verify Week View**
   - Should see current week (Mon-Sun)
   - Week range shown: "Week of Feb 16-22, 2026"
   - Today's column highlighted in blue
   - 7 columns on desktop, vertical list on mobile

3. **Navigate Weeks**
   - Click "← Prev" to go to previous week
   - Click "Next →" to go to next week
   - Click "Today" to jump back to current week

### Test Flow 2: Create Single Event

1. **Open Event Modal**
   - Click "+ Add Event" button
   - Or click "+ Add event" in any empty day

2. **Fill Event Form**
   - Title: "Team Meeting"
   - Description: "Weekly sync with the team"
   - Date: Select tomorrow's date
   - Start Time: 14:00 (2:00 PM)
   - End Time: 15:00 (3:00 PM)
   - Leave "Repeat this event" unchecked

3. **Save Event**
   - Click "Save" button
   - Modal closes
   - Event appears in calendar on selected day
   - Shows "Team Meeting" with "2:00 PM" time

### Test Flow 3: Create Recurring Event

1. **Open Event Modal**
   - Click "+ Add Event"

2. **Fill Recurring Event**
   - Title: "Daily Standup"
   - Date: Select Monday of next week
   - Start Time: 09:00
   - End Time: 09:30
   - ✅ Check "Repeat this event"

3. **Configure Recurrence**
   - Click days: Mon, Tue, Wed, Thu, Fri
   - Set "Repeat until": 3 months from now
   - Notice blue highlight on selected days

4. **Save Event**
   - Click "Save"
   - Event appears on all selected days
   - Shows 🔁 icon indicating recurring event

### Test Flow 4: Edit Recurring Event

1. **Click Recurring Event**
   - Click any "Daily Standup" event
   - Modal opens with event details

2. **Make Changes**
   - Change time from 09:00 to 10:00
   - Notice "Edit scope" options appear:
     - ( ) This event only
     - ( ) This and future events
     - (•) All events in series

3. **Test Different Scopes**

   **Option A: Edit This Event Only**
   - Select "This event only"
   - Click "Save"
   - Only clicked event updated, others unchanged

   **Option B: Edit This and Future**
   - Click another standup event
   - Change time to 09:15
   - Select "This and future events"
   - Save
   - This event and all future ones updated
   - Past events unchanged

   **Option C: Edit All Events**
   - Click any standup
   - Change description
   - Select "All events in series"
   - Save
   - Entire series updated

### Test Flow 5: Delete Recurring Event

1. **Click Recurring Event**
   - Click any "Daily Standup"

2. **Click Delete Button**
   - Red "Delete" button at bottom left
   - Confirmation dialog appears

3. **Select Delete Scope**
   - ( ) This event only
   - ( ) This and future events
   - ( ) All events in series

4. **Confirm Delete**
   - Select desired scope
   - Click red "Delete" button
   - Events removed according to scope

### Test Flow 6: Dashboard Widget

1. **Navigate to Dashboard**
   - Click "🏠 Dashboard" in sidebar
   - Or go to http://localhost:3000/dashboard

2. **View Calendar Widget**
   - Widget titled "📅 This Week"
   - Shows week range "Feb 16 - Feb 22"
   - Lists next 5 upcoming events
   - Today's events highlighted in blue
   - Shows recurring indicator (🔁) if applicable

3. **Click "View Full Week"**
   - Button at bottom of widget
   - Navigates to full calendar page

---

## 🧪 Advanced Testing

### Mobile Responsive Testing

1. **Open DevTools**
   - Press F12 or Cmd+Option+I
   - Click device toolbar icon

2. **Test Mobile View**
   - Select "iPhone 12 Pro" or similar
   - Verify vertical day list
   - Test touch interactions
   - Verify modals are full-screen on small devices

3. **Test Tablet View**
   - Select "iPad" or similar
   - Verify 7-column grid still shows
   - Test modal centering

### Validation Testing

1. **Empty Title**
   - Try to save event without title
   - Should show error: "Title is required"

2. **Invalid Times**
   - Set end time before start time
   - Should show error: "End time must be after start time"

3. **Recurring Without Days**
   - Check "Repeat this event"
   - Don't select any days
   - Should show error: "Select at least one day"

4. **Recurring Without End Date**
   - Check "Repeat this event"
   - Select days but no end date
   - Should show error: "End date is required for recurring events"

### Keyboard Navigation

1. **Open Modal with Keyboard**
   - Tab to "+ Add Event" button
   - Press Enter

2. **Navigate Form**
   - Tab through all fields
   - Verify focus indicators visible

3. **Close with Escape**
   - Press Escape key
   - Modal should close

---

## 📊 Expected Results

### Calendar Page

```
┌────────────────────────────────────────────────────────────┐
│  Calendar                                                   │
│  Weekly schedule and events                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ← Prev    Week of Feb 16-22, 2026    Next →    [Today]   │
│                                    [+ Add Event]           │
│                                                            │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐      │
│  │ MON  │ TUE  │ WED  │ THU  │ FRI  │ SAT  │ SUN  │      │
│  │  16  │  17  │  18  │  19  │  20  │  21  │  22  │      │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤      │
│  │ 🔁   │ 🔁   │ 🔁   │ 🔁   │ 🔁   │      │      │      │
│  │ 9:00 │ 9:00 │ 9:00 │ 9:00 │ 9:00 │      │      │      │
│  │Stand │Stand │Stand │Stand │Stand │      │      │      │
│  │      │      │      │      │      │      │      │      │
│  │      │ 2:00 │      │      │      │      │      │      │
│  │      │Team  │      │      │      │      │      │      │
│  │      │Meet  │      │      │      │      │      │      │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Dashboard Widget

```
┌────────────────────────────────────────┐
│  📅 This Week                          │
│  Feb 16 - Feb 22                       │
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐   │
│  │  MON  🔁 Daily Standup         │   │
│  │   16     9:00 AM - 9:30 AM     │   │
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │  TUE  🔁 Daily Standup         │   │
│  │   17     9:00 AM - 9:30 AM     │   │
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │  TUE     Team Meeting          │   │
│  │   17     2:00 PM - 3:00 PM     │   │
│  └────────────────────────────────┘   │
│                                        │
│  +2 more events this week              │
│                                        │
│  [ View Full Week → ]                  │
└────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Events Not Showing

**Check:**
1. Backend running on port 8000
2. Frontend connected to correct API endpoint
3. Database has calendar table
4. No console errors in browser DevTools

**Fix:**
```bash
# Check backend logs
curl http://localhost:8000/api/v1/calendar/events?start_date=2026-02-16&end_date=2026-02-22

# Should return:
{"events": [...], "total": X}
```

### Modal Not Opening

**Check:**
1. Browser console for JavaScript errors
2. React DevTools for component state
3. Network tab for failed API calls

**Fix:**
```bash
# Rebuild frontend
cd frontend
rm -rf .next
npm run dev
```

### Recurring Events Not Working

**Check:**
1. Database migration ran successfully
2. Backend has recurrence logic
3. API returns `recurrence_pattern` field

**Fix:**
```bash
# Check database schema
cd backend
alembic current
alembic upgrade head
```

### Styling Issues

**Check:**
1. Tailwind CSS compiled correctly
2. No conflicting global styles
3. Dark mode settings (if enabled)

**Fix:**
```bash
# Rebuild Tailwind
cd frontend
npm run build
```

---

## ✅ Success Criteria

You should be able to:

- ✅ View current week calendar
- ✅ Navigate between weeks (prev/next/today)
- ✅ Create single events
- ✅ Create recurring events (Mon-Fri pattern)
- ✅ Edit events with scope selection
- ✅ Delete events with scope selection
- ✅ See events on dashboard widget
- ✅ Use on mobile (responsive)
- ✅ See today highlighted
- ✅ See recurring indicators (🔁)
- ✅ Validate form inputs
- ✅ Close modals with Escape key

---

## 📝 Sample Test Data

Create these events to test thoroughly:

1. **Single Event**
   - Title: "Doctor Appointment"
   - Date: Tomorrow
   - Time: 3:00 PM - 4:00 PM
   - Recurring: No

2. **Weekday Recurring**
   - Title: "Morning Standup"
   - Date: Next Monday
   - Time: 9:00 AM - 9:15 AM
   - Recurring: Yes
   - Days: Mon, Tue, Wed, Thu, Fri
   - Until: 3 months from now

3. **Workout Schedule**
   - Title: "Gym - Upper Body"
   - Date: Next Monday
   - Time: 6:00 PM - 7:30 PM
   - Recurring: Yes
   - Days: Mon, Wed, Fri
   - Until: 2 months from now

4. **Weekend Event**
   - Title: "Family Dinner"
   - Date: This Saturday
   - Time: 6:00 PM - 8:00 PM
   - Recurring: No

---

**Ready to test!** 🎉

If you encounter any issues, check:
- Backend logs: Terminal 1
- Frontend logs: Terminal 2
- Browser console: F12 → Console tab
- Network requests: F12 → Network tab
