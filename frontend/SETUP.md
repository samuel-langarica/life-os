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

## Running with Backend

1. Start backend on port 8000
2. Start frontend: `npm run dev`
3. Visit http://localhost:3000

## Design System

See `COMMAND_DESIGN_SYSTEM.md` for full reference. Uses CSS custom properties in `globals.css` for dark/light theming.

## Production Deployment

```bash
docker build -t lifeos-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  .

docker run -p 3000:3000 lifeos-frontend
```

Requires `NEXT_PUBLIC_API_URL` at build time.

## Troubleshooting

- **Module not found:** `rm -rf node_modules .next && npm install`
- **Port in use:** `PORT=3001 npm run dev`
- **Auth not working:** Check backend is on :8000, verify `.env.local`, check cookies in DevTools
