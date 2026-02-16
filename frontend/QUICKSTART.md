# Life OS Frontend - Quick Start

Get the frontend running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- npm or yarn installed

Check versions:
```bash
node --version  # Should be v20.x or higher
npm --version   # Should be 9.x or higher
```

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (takes ~2 minutes)
npm install
```

## Configuration

```bash
# Create environment file
cp .env.local.example .env.local

# (Optional) Edit if backend is not on localhost:8000
nano .env.local
```

Default `.env.local` content:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Run Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.1.0
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

## Open in Browser

Visit: **http://localhost:3000**

You should see the login page with:
- "Life OS" title
- Username field (pre-filled with "samuel")
- Password field
- "Sign In" button

## What to Expect

### Without Backend Running

✅ **What works:**
- Login page renders correctly
- Navigation is accessible
- All routes load
- UI components display properly
- Responsive design works

❌ **What doesn't work:**
- Login form submission (no API)
- Data fetching (no backend)
- Protected routes redirect to login

**This is expected!** The frontend is complete, but needs the backend API.

### With Backend Running

Once you build and run the backend on port 8000:

✅ **Everything works:**
- Login with credentials
- Navigate to dashboard
- View all modules
- Logout

---

## Troubleshooting

### Port 3000 already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Module not found errors

```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
```

### Styles not loading

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### TypeScript errors

```bash
# Check configuration
npx tsc --noEmit
```

---

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Next Steps

1. **Replace placeholder icons**
   - Add actual PNG files to `public/icons/`
   - Sizes: 192x192, 512x512, apple-touch-icon

2. **Build the backend**
   - See `../backend/` directory
   - Follow backend setup guide

3. **Test authentication**
   - Start backend on port 8000
   - Login through frontend
   - Verify cookies are set

4. **Begin Phase 2**
   - Implement dashboard data fetching
   - Build journal forms
   - Add module functionality

---

## File Structure Quick Reference

```
frontend/
├── src/
│   ├── app/              # Pages and routes
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── stores/           # State management
├── public/               # Static assets
├── package.json          # Dependencies
└── .env.local           # Environment (create this)
```

---

## Common First-Time Questions

**Q: Why can't I log in?**
A: The backend API needs to be running. Build and start the backend first.

**Q: Why do I see "Session expired" errors?**
A: This is expected without the backend. The API client tries to refresh tokens but fails gracefully.

**Q: Where do I add my backend URL?**
A: In `.env.local`, set `NEXT_PUBLIC_API_URL` to your backend URL.

**Q: Can I use a different port?**
A: Yes, run `PORT=3001 npm run dev` to use port 3001.

**Q: How do I build for production?**
A: Run `npm run build` then `npm start`. See `Dockerfile` for containerized deployment.

**Q: Where are the icons stored?**
A: In `public/icons/`. Replace the placeholders with actual PNG files.

**Q: How do I change the theme?**
A: Edit CSS variables in `src/app/globals.css`.

---

## Success Indicators

You've successfully started the frontend when you see:

1. ✅ No errors in terminal
2. ✅ "Ready in X seconds" message
3. ✅ Login page loads at http://localhost:3000
4. ✅ No red errors in browser console
5. ✅ Page is styled correctly (not plain HTML)

---

## Getting Help

1. Check `SETUP.md` for detailed instructions
2. See `VERIFICATION.md` for troubleshooting
3. Review `BUILD_SUMMARY.md` for what's included
4. Check browser console for specific errors

---

**Total Setup Time**: ~5 minutes
**Ready to code?** Start with `src/app/(authenticated)/dashboard/page.tsx`!
