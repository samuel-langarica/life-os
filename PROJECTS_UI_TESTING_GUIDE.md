# Projects UI Testing Guide

## Quick Start Testing

### 1. Start the Application

**Terminal 1 - Backend:**
```bash
cd /Users/samuel/life-os/backend
docker-compose up -d  # Start PostgreSQL
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /Users/samuel/life-os/frontend
npm run dev
```

**Access:** http://localhost:3000

### 2. Login
- Username: (your configured username)
- Password: (your configured password)

### 3. Navigate to Projects
- Click "Projects" in the sidebar (desktop) or bottom nav (mobile)
- You should see three tabs: Barbania, Chaliao, Work

## Feature Testing Checklist

### Tab Navigation
- [ ] Click each tab (Barbania, Chaliao, Work)
- [ ] Verify each tab loads independently
- [ ] Check visual indicator shows active tab
- [ ] Verify URL doesn't change (client-side navigation)

### Current Objective
- [ ] Click "Edit" button under Current Objective
- [ ] Enter objective text: "Ship prototype v0.1"
- [ ] Click "Save"
- [ ] Verify objective displays on page
- [ ] Switch to another tab and back
- [ ] Verify objective persists

### Create Tasks
- [ ] Click "+ Add Task" in Backlog column
- [ ] Enter title: "Design user interface"
- [ ] Enter description: "Create mockups for main screens"
- [ ] Click "Save"
- [ ] Verify task appears in Backlog column

- [ ] Click "+ Add Task" in In Progress column
- [ ] Enter title: "Build authentication"
- [ ] Click "Save" (no description)
- [ ] Verify task appears in In Progress column

- [ ] Create 2-3 more tasks in different columns

### Edit Tasks
- [ ] Click edit (pencil icon) on any task
- [ ] Modify the title
- [ ] Add/modify description
- [ ] Change status via dropdown
- [ ] Click "Save"
- [ ] Verify changes persist

### Drag-and-Drop: Move Between Columns
- [ ] Drag a task from Backlog to In Progress
- [ ] Verify task moves to new column
- [ ] Verify task status updates
- [ ] Refresh page - verify move persisted

- [ ] Drag a task from In Progress to Completed
- [ ] Verify task moves to Completed column
- [ ] Verify green styling on Completed column

- [ ] Drag a task from Completed back to Backlog
- [ ] Verify backward movement works

### Drag-and-Drop: Reorder Within Column
- [ ] Create 3+ tasks in Backlog
- [ ] Drag task #1 to position #3
- [ ] Verify tasks reorder visually
- [ ] Refresh page - verify order persisted

- [ ] Drag task from bottom to top
- [ ] Verify smooth reordering

### Delete Task
- [ ] Click edit on any task
- [ ] Click "Delete" button
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" - verify nothing happens
- [ ] Click edit again, click "Delete", confirm
- [ ] Verify task is removed

### Clear Completed Tasks
- [ ] Move 3+ tasks to Completed column
- [ ] Verify "Clear All Completed (N)" button appears
- [ ] Click button
- [ ] Verify confirmation dialog shows count
- [ ] Click "Cancel" - verify nothing happens
- [ ] Click "Clear All Completed" again, confirm
- [ ] Verify all completed tasks are removed
- [ ] Verify button disappears when no completed tasks

### Project Notes
- [ ] Click "Edit" under Notes section
- [ ] Enter multi-line notes:
  ```
  Focus on core features first
  Avoid feature creep
  Ship fast, iterate based on feedback
  ```
- [ ] Click "Save"
- [ ] Verify notes display on page
- [ ] Edit notes again, modify text
- [ ] Verify updates persist

### Dashboard Widget
- [ ] Navigate to Dashboard
- [ ] Locate "Current Objectives" widget
- [ ] Verify all three projects are listed
- [ ] Verify objectives are displayed
- [ ] Verify task counts are shown with colored dots:
  - Blue dot = In Progress count
  - Gray dot = Backlog count
  - Green dot = Completed count
- [ ] Click "Manage Projects →" link
- [ ] Verify navigation to Projects page

### Switch Between Projects
- [ ] Go to Barbania tab
- [ ] Add objective, tasks, and notes
- [ ] Switch to Chaliao tab
- [ ] Verify Chaliao is empty (fresh project)
- [ ] Add different objective and tasks
- [ ] Switch to Work tab
- [ ] Add different content
- [ ] Switch back to Barbania
- [ ] Verify Barbania content is unchanged

### Responsive Design

**Desktop (>1024px):**
- [ ] Verify three columns side-by-side
- [ ] All columns visible without scrolling
- [ ] Sidebar navigation visible

**Tablet (768-1024px):**
- [ ] Verify columns may scroll horizontally
- [ ] Touch/mouse drag both work
- [ ] Modals are centered

**Mobile (<768px):**
- [ ] Verify columns stack or scroll horizontally
- [ ] Bottom navigation visible
- [ ] Modals are full-width or nearly full-width
- [ ] Touch drag works smoothly
- [ ] Tab navigation readable

### Dark Mode
- [ ] Toggle dark mode (system preference or manual)
- [ ] Verify all components render correctly
- [ ] Check task cards have proper contrast
- [ ] Check modal backgrounds
- [ ] Check column colors maintain visual hierarchy

### Error Handling
- [ ] Stop backend server
- [ ] Try to create a task
- [ ] Verify error handling (timeout or error message)
- [ ] Restart backend
- [ ] Verify app recovers

- [ ] Try to save task with empty title
- [ ] Verify validation prevents submission

### Performance
- [ ] Create 20+ tasks across columns
- [ ] Verify drag-and-drop remains smooth
- [ ] Check for any UI lag
- [ ] Verify scroll performance

### Edge Cases
- [ ] Create task with very long title (approaching 500 chars)
- [ ] Verify it displays properly
- [ ] Create task with very long description
- [ ] Verify description truncates in card view
- [ ] Verify full description shows in edit modal

- [ ] Create project with no objective
- [ ] Verify placeholder text shows
- [ ] Create project with no notes
- [ ] Verify placeholder text shows

- [ ] Empty all tasks from a project
- [ ] Verify empty state is clean
- [ ] Verify no errors in console

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile Safari (if available)
- [ ] Mobile Chrome (if available)

## Visual Inspection

### Typography
- [ ] Headings are clear and hierarchical
- [ ] Body text is readable
- [ ] Card text not too cramped
- [ ] Modal text well-spaced

### Spacing
- [ ] Consistent gaps between elements
- [ ] Cards not touching column edges
- [ ] Modals have appropriate padding
- [ ] No awkward whitespace

### Colors
- [ ] Status colors are distinct (gray/blue/green)
- [ ] Text has good contrast
- [ ] Hover states visible
- [ ] Active tab clearly indicated
- [ ] Dark mode maintains good contrast

### Interactions
- [ ] Buttons have hover states
- [ ] Drag feedback is clear
- [ ] Drop zones highlight on drag-over
- [ ] Loading states show during saves
- [ ] Transitions are smooth (not jarring)

## Console Checks

Open browser DevTools Console and verify:
- [ ] No errors on page load
- [ ] No errors when creating task
- [ ] No errors when dragging tasks
- [ ] No errors when saving changes
- [ ] Network requests complete successfully
- [ ] No infinite loops or excessive re-renders

## Known Good State

After testing, you should have:
- 3 projects with unique objectives
- Multiple tasks in various states
- Notes on each project
- Dashboard showing all project summaries
- No console errors
- Smooth drag-and-drop experience

## Reporting Issues

If you find any issues, note:
1. **What you did:** Specific steps
2. **Expected:** What should happen
3. **Actual:** What actually happened
4. **Browser/Device:** Environment details
5. **Console errors:** Any error messages

## Success Criteria

✅ All features work as expected
✅ Drag-and-drop is smooth and intuitive
✅ Data persists across page reloads
✅ Responsive design works on all screen sizes
✅ Dark mode looks good
✅ No console errors
✅ Performance is acceptable with many tasks

---

**Ready for Production:** Once all tests pass!
