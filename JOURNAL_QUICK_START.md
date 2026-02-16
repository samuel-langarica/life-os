# Journal Module - Quick Start Guide

## Test the Module in 2 Minutes

### 1. Verify Backend

```bash
cd /Users/samuel/life-os/backend

# Check migration is applied
alembic current
# Should show: 6b469389eb7a (head)

# Verify imports work
python3 -c "
import sys
sys.path.insert(0, '.')
from app.models.journal import JournalEntry
from app.schemas.journal import EntryType
from app.repositories.journal import JournalRepository
from app.services.journal import JournalService
print('✓ All backend imports successful')
"

# Start backend (if not running)
uvicorn app.main:app --reload --port 8000
# Visit http://localhost:8000/api/docs to see Journal endpoints
```

### 2. Verify Frontend

```bash
cd /Users/samuel/life-os/frontend

# Check files exist
ls src/lib/api/journal.ts
ls src/app/\(authenticated\)/journal/page.tsx
ls src/components/dashboard/JournalWidget.tsx

# Start frontend (if not running)
npm run dev
# Visit http://localhost:3000
```

### 3. Test User Flow

1. **Login** at http://localhost:3000/login

2. **Visit Dashboard** - You should see the Journal Widget showing:
   - Morning Pages status
   - Reflection status
   - Current streaks (0 to start)

3. **Go to Journal** - Click on the Journal link or visit `/journal`
   - See today's status
   - See "Write Now" buttons

4. **Write Morning Pages** - Click "Write Now" for Morning Pages
   - Type some text
   - Wait 2 seconds - should see "Saved ✓"
   - Click "Done"
   - Should return to journal hub with checkmark

5. **Write Daily Reflection** - Click "Write Now" for Reflection
   - Fill out the three prompts
   - Click "Save Reflection"
   - Should return to hub with checkmark

6. **Check Dashboard** - Go back to dashboard
   - Should see both entries marked complete
   - Streaks should show "🔥 1 day streak"

7. **View Timeline** - Visit `/journal/timeline`
   - Should see your entries listed
   - Try filtering by type

### 4. Test API Directly

```bash
# Get journal status
curl -X GET http://localhost:8000/api/v1/journal/status \
  -H "Cookie: access_token=YOUR_TOKEN" \
  | jq

# List entries
curl -X GET http://localhost:8000/api/v1/journal/entries \
  -H "Cookie: access_token=YOUR_TOKEN" \
  | jq
```

## Expected Results

After writing entries:

**Dashboard Widget:**
```
📓 Journal Status
├─ 🌅 Morning Pages
│  └─ 🔥 1 day streak ✓
├─ 🌙 Reflection  
│  └─ 🔥 1 day streak ✓
└─ Entries this week: 2
```

**Journal Hub:**
```
Today's Status:
- Morning Pages: ✓ (Read Entry)
- Daily Reflection: ✓ (Read Entry)

This Week:
- 2 entries written
- Weekly Review: Not done yet
```

## Common Issues

**Issue:** "access_token" cookie not found
- **Solution:** Login through the frontend at `/login` first

**Issue:** CORS errors in browser console
- **Solution:** Check NEXT_PUBLIC_API_URL in frontend/.env.local
- **Solution:** Ensure backend CORS allows your frontend URL

**Issue:** Auto-save not working
- **Solution:** Check browser console for errors
- **Solution:** Verify backend is running and accessible

**Issue:** Streaks show 0 even after writing
- **Solution:** Refresh the page
- **Solution:** Check backend `/api/v1/journal/status` endpoint

## All Working? 🎉

If all the above works, your Journal module is fully functional!

Next: Start your daily journaling practice:
- Morning: Write Morning Pages
- Evening: Complete Daily Reflection  
- Sunday: Do Weekly Review
