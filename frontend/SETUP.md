# Life OS Frontend - Setup Guide

Complete guide to get the frontend running.

## Quick Start

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

The app will be available at http://localhost:3000

## What's Been Built

### Core Infrastructure

- [x] Next.js 14 App Router setup
- [x] TypeScript configuration
- [x] Tailwind CSS + design system
- [x] API client with auto-refresh
- [x] Authentication flow
- [x] Route protection middleware
- [x] PWA manifest and service worker

### State Management

- [x] Zustand stores (auth, capture, workout)
- [x] SWR configuration for data fetching

### UI Components

- [x] Button (multiple variants)
- [x] Input (with label and error states)
- [x] Card (header, content, footer)
- [x] Spinner (loading indicator)

### Layout Components

- [x] AppShell (main layout wrapper)
- [x] Sidebar (desktop navigation)
- [x] BottomNav (mobile navigation)
- [x] TopBar (week display + user info)

### Pages (All Routes)

#### Authentication
- [x] `/login` - Login page with form

#### Authenticated Routes
- [x] `/dashboard` - Weekly dashboard (skeleton)
- [x] `/journal` - Journal entries (placeholder)
- [x] `/fitness` - Fitness tracking (placeholder)
- [x] `/projects` - Project management (placeholder)
- [x] `/captures` - Inbox (placeholder)
- [x] `/calendar` - Week view (placeholder)
- [x] `/settings` - Settings + logout

#### Special Pages
- [x] `page.tsx` - Root redirect
- [x] `not-found.tsx` - 404 page
- [x] `loading.tsx` - Global loading state

## File Structure

```
frontend/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Unauthenticated routes
│   │   │   ├── layout.tsx             # Centered auth layout
│   │   │   └── login/
│   │   │       └── page.tsx           # Login page
│   │   │
│   │   ├── (authenticated)/           # Protected routes
│   │   │   ├── layout.tsx             # App shell layout
│   │   │   ├── dashboard/page.tsx     # Weekly dashboard
│   │   │   ├── journal/page.tsx       # Journal module
│   │   │   ├── fitness/page.tsx       # Fitness module
│   │   │   ├── projects/page.tsx      # Projects module
│   │   │   ├── captures/page.tsx      # Captures inbox
│   │   │   ├── calendar/page.tsx      # Calendar module
│   │   │   └── settings/page.tsx      # Settings + logout
│   │   │
│   │   ├── layout.tsx                 # Root layout (SWR, PWA)
│   │   ├── page.tsx                   # Root redirect
│   │   ├── loading.tsx                # Global loading
│   │   ├── not-found.tsx              # 404 page
│   │   └── globals.css                # Global styles + CSS vars
│   │
│   ├── components/
│   │   ├── ui/                        # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── spinner.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── LoginForm.tsx          # Login form with validation
│   │   │
│   │   ├── dashboard/
│   │   │   └── WeeklyDashboard.tsx    # Dashboard skeleton
│   │   │
│   │   └── layout/
│   │       ├── AppShell.tsx           # Main app layout
│   │       ├── Sidebar.tsx            # Desktop navigation
│   │       ├── BottomNav.tsx          # Mobile navigation
│   │       └── TopBar.tsx             # Week info + user
│   │
│   ├── lib/
│   │   ├── api-client.ts              # Fetch wrapper + auth
│   │   ├── types.ts                   # TypeScript types
│   │   ├── utils.ts                   # Helper functions
│   │   ├── constants.ts               # App constants
│   │   └── swr-config.ts              # SWR configuration
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── auth-store.ts              # User + auth state
│   │   ├── capture-store.ts           # Quick capture modal
│   │   └── workout-store.ts           # Workout timer
│   │
│   └── middleware.ts                  # Route protection
│
├── public/
│   ├── manifest.json                  # PWA manifest
│   ├── sw.js                          # Service worker
│   └── icons/                         # App icons (placeholders)
│
├── package.json                       # Dependencies
├── next.config.js                     # Next.js config
├── tailwind.config.ts                 # Tailwind + design tokens
├── tsconfig.json                      # TypeScript config
├── postcss.config.js                  # PostCSS config
├── Dockerfile                         # Production build
├── .env.local.example                 # Environment template
├── .gitignore                         # Git ignore rules
└── README.md                          # Documentation
```

## Current State

### Working Features

1. **Authentication**
   - Login page with form validation
   - httpOnly cookie-based auth
   - Automatic token refresh on 401
   - Route protection via middleware
   - Logout functionality

2. **Navigation**
   - Responsive sidebar (desktop/tablet)
   - Bottom navigation (mobile)
   - Active route highlighting
   - All module routes accessible

3. **Layout**
   - Responsive design (mobile-first)
   - Persistent navigation
   - Top bar with week display
   - Route groups for auth/authenticated

4. **PWA Setup**
   - manifest.json configured
   - Service worker for static assets
   - Installable on supported devices

### What's Not Implemented Yet

All module functionality is placeholder:
- Dashboard data fetching
- Journal CRUD operations
- Fitness tracking
- Project management
- Calendar events
- Capture inbox

These will be implemented in Phase 2-4 (see product-design/04_FRONTEND_AND_DEPLOYMENT.md).

## Testing the Frontend

### Without Backend

You can run the frontend without the backend:

```bash
npm run dev
```

- Login page will render but auth will fail (no backend)
- Protected routes will redirect to login (no cookies)
- UI components and navigation are fully functional

### With Backend

Once the backend is running:

1. Start backend on port 8000
2. Start frontend: `npm run dev`
3. Visit http://localhost:3000
4. Login with default credentials:
   - Username: `samuel`
   - Password: (set during backend setup)

## Design System

### Colors

The app uses CSS variables for theming:

- `--primary`: Main brand color (#2563EB)
- `--background`: Page background
- `--foreground`: Text color
- `--card`: Card background
- `--muted`: Secondary text
- `--destructive`: Error/danger states

See `src/app/globals.css` for full color palette.

### Components

All UI components support:
- Light/dark mode (via CSS variables)
- Responsive sizing
- Accessibility features
- TypeScript props

## Next Steps

1. **Icon Replacement**
   - Replace placeholder icons in `public/icons/`
   - Generate proper PWA icons (192x192, 512x512)

2. **Backend Integration**
   - Build backend API (separate task)
   - Test auth flow end-to-end
   - Implement data fetching with SWR

3. **Module Implementation**
   - Dashboard aggregation
   - Journal entry forms
   - Fitness tracking UI
   - Project boards
   - Calendar week view
   - Capture modal

4. **Polish**
   - Loading skeletons
   - Error boundaries
   - Toast notifications
   - Empty states
   - Animations

## Production Deployment

### Docker Build

```bash
docker build -t lifeos-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  .

docker run -p 3000:3000 lifeos-frontend
```

### Environment Variables

Production requires:
- `NEXT_PUBLIC_API_URL`: Full API URL (https://yourdomain.com)

This is baked into the build at build-time.

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules .next
npm install
```

### Port 3000 already in use

```bash
# Use different port
PORT=3001 npm run dev
```

### Authentication not working

1. Check backend is running on port 8000
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors
4. Verify cookies are being set (check DevTools → Application → Cookies)

### Build errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [SWR](https://swr.vercel.app/)
- [Radix UI](https://www.radix-ui.com/)

## Support

For issues or questions:
1. Check this SETUP.md
2. Review product-design/04_FRONTEND_AND_DEPLOYMENT.md
3. Check browser console for errors
4. Verify backend is running and accessible
