# Frontend Captures Module - Verification Guide

## Quick Start

### 1. Start the Backend API
```bash
cd /Users/samuel/life-os/backend
docker-compose up -d
# or
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend
```bash
cd /Users/samuel/life-os/frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

## Verification Steps

### Step 1: Login
1. Navigate to http://localhost:3000
2. You should be redirected to `/login`
3. Enter your password and log in
4. You should land on the dashboard

### Step 2: Check Floating Button
1. On the dashboard page, look for a blue circular [+] button in the bottom-right corner
2. On mobile view, it should be positioned above the bottom navigation bar
3. On desktop view, it should be at the bottom-right of the screen

### Step 3: Test Quick Capture
1. Click the floating [+] button
2. A modal should appear with:
   - Title: "Quick Capture"
   - Auto-focused textarea
   - Cancel and "Save to Inbox" buttons
3. Type some text (e.g., "Test capture from UI")
4. Click "Save to Inbox"
5. Modal should close and text should clear
6. Check the browser console - should see no errors

### Step 4: Check Dashboard Widget
1. On the dashboard page, scroll to the "Inbox" widget
2. It should show:
   - A large number (count of unprocessed captures)
   - Text: "X captures to process"
   - Button: "Process Now"
3. If you just created a capture, it should show "1 capture to process"

### Step 5: Test Captures Page
1. Click "Process Now" or navigate to `/captures`
2. You should see:
   - Header: "Inbox" with count
   - List of capture cards
3. Each capture card should show:
   - The capture text
   - Timestamp (formatted like "Feb 16, 2026")
   - Source badge (e.g., "Manual")
   - Three action buttons: Copy, Done, Delete

### Step 6: Test Copy Action
1. Click the "Copy" button on a capture
2. You should see an alert: "Copied to clipboard!"
3. Paste somewhere (Cmd+V / Ctrl+V) to verify it copied

### Step 7: Test Done Action
1. Click the "Done" button on a capture
2. The capture should:
   - Disappear from the list
   - Update the count in the header
   - Update the dashboard widget count (refresh dashboard to see)

### Step 8: Test Delete Action
1. Click the "Delete" button on a capture
2. You should see a confirmation dialog
3. Click "OK"
4. The capture should be removed
5. Count should update

### Step 9: Test Empty State
1. Mark all captures as done or delete them
2. You should see:
   - Large 📥 emoji
   - "Inbox Zero!" heading
   - "All captures processed" text

### Step 10: Test Mobile Responsive
1. Open browser DevTools (F12)
2. Toggle device emulation (mobile view)
3. Verify:
   - Floating button is above bottom nav
   - Modal fits on screen with margins
   - Capture card buttons are accessible
   - Everything is touch-friendly

## API Endpoints Being Called

### When you open the dashboard:
```
GET http://localhost:8000/api/v1/captures/count
```

### When you open the captures page:
```
GET http://localhost:8000/api/v1/captures?include_processed=false
```

### When you create a capture:
```
POST http://localhost:8000/api/v1/captures
Body: { "text": "...", "source": "manual" }
```

### When you mark a capture as done:
```
PATCH http://localhost:8000/api/v1/captures/{id}
Body: { "processed": true }
```

### When you delete a capture:
```
DELETE http://localhost:8000/api/v1/captures/{id}
```

## Browser Console Testing

Open the browser console (F12) and run:

```javascript
// Check if the store is accessible
console.log('Capture store available');

// Check if API client is working
fetch('http://localhost:8000/api/v1/captures/count', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('Inbox count:', data));
```

## Common Issues & Solutions

### Issue: Modal doesn't open
- **Check**: Browser console for errors
- **Solution**: Make sure Zustand store is initialized correctly

### Issue: API calls fail with 401
- **Check**: Are you logged in?
- **Solution**: Go to `/login` and log in again

### Issue: API calls fail with 404
- **Check**: Is the backend running?
- **Solution**: Start the backend server

### Issue: Count doesn't update after actions
- **Check**: Browser console for SWR mutation errors
- **Solution**: Hard refresh the page (Cmd+Shift+R)

### Issue: Floating button not visible
- **Check**: Are you on an authenticated page?
- **Solution**: Navigate to `/dashboard` or any authenticated route

### Issue: TypeScript errors
- **Check**: Run `npm run build` to see specific errors
- **Solution**: Check that all imports are correct

## Performance Verification

### Check Network Tab
1. Open DevTools → Network tab
2. Create a capture
3. You should see:
   - POST request to `/api/v1/captures` (should be fast, < 500ms)
   - GET request to `/api/v1/captures` (cache invalidation)
   - GET request to `/api/v1/captures/count` (cache invalidation)

### Check Bundle Size
The captures page adds approximately:
- **2.52 kB** to the page bundle
- **99.4 kB** total First Load JS (acceptable)

## Testing Checklist

Copy this checklist and mark off as you test:

- [ ] Frontend dev server starts without errors
- [ ] Backend API is running and accessible
- [ ] Can log in successfully
- [ ] Floating [+] button visible on all authenticated pages
- [ ] Clicking [+] opens quick capture modal
- [ ] Textarea auto-focuses when modal opens
- [ ] Can type in textarea
- [ ] Save button disabled when empty
- [ ] ESC key closes modal
- [ ] Clicking overlay closes modal
- [ ] Can submit a capture successfully
- [ ] Modal closes after submit
- [ ] Dashboard shows correct inbox count
- [ ] "Process Now" button navigates to captures page
- [ ] Captures page loads and displays captures
- [ ] Capture cards show correct information
- [ ] Copy button works (copies to clipboard)
- [ ] Done button marks capture as processed
- [ ] Done button removes capture from list
- [ ] Delete button shows confirmation
- [ ] Delete button removes capture
- [ ] Counts update after actions
- [ ] Empty state shows when no captures
- [ ] Mobile responsive layout works
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds without errors

## Expected User Flow

### Scenario: Morning Brain Dump
1. User wakes up, has ideas
2. Opens Life OS on phone
3. Taps floating [+] button
4. Types: "Research new standing desk options"
5. Taps "Save to Inbox"
6. Repeats for several ideas
7. Later, opens laptop
8. Sees "5 captures to process" on dashboard
9. Clicks "Process Now"
10. For each capture:
    - Reads the capture
    - Decides what to do (create project task, add to calendar, etc.)
    - Clicks "Copy" to copy text
    - Pastes into appropriate place
    - Clicks "Done"
11. Reaches inbox zero
12. Feels organized and productive

## Development Tips

### Hot Reload
Changes to these files will hot reload:
- All `.tsx` components
- API client functions
- Store definitions

No restart needed during development.

### Debugging
Add console logs in components:
```tsx
console.log('Modal state:', isModalOpen);
console.log('Captures data:', data);
console.log('SWR error:', error);
```

### SWR DevTools
Install SWR DevTools for better debugging:
```bash
npm install @swr-devtools/react
```

## Next Steps After Verification

Once all tests pass:

1. **User Testing**: Have the actual user (Samuel) test the flow
2. **Mobile Testing**: Test on actual iPhone device
3. **Siri Shortcuts**: Set up iOS Shortcuts integration
4. **Polish**: Add any UX improvements based on feedback
5. **Documentation**: Update user guide with captures workflow

## Success Metrics

After 1 week of use, successful implementation should show:
- Daily captures created (average 3-5 per day)
- Regular inbox processing (reaching zero 5+ times per week)
- Fast capture time (< 10 seconds from thought to saved)
- No user-reported bugs or friction points

---

**Status**: Ready for Testing

All components are implemented and the build succeeds. Start both servers and follow the verification steps above.
