# Life OS - Technical Architecture (Part 4)
# Frontend Architecture and Deployment Strategy

---

## 1. FRONTEND FOLDER STRUCTURE

Using Next.js 14+ App Router.

**Why App Router over Pages Router:**
- Nested layouts (persistent sidebar/bottom nav without re-rendering)
- Server Components for initial load performance
- Built-in loading/error states per route
- Better code organization with co-located components
- Route groups for auth vs. authenticated layouts

```
frontend/
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker (static asset caching only)
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   └── splash/
│       └── ...                     # PWA splash screens
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (html, body, providers)
│   │   ├── loading.tsx             # Global loading state
│   │   ├── not-found.tsx           # 404 page
│   │   │
│   │   ├── (auth)/                 # Route group: unauthenticated
│   │   │   ├── layout.tsx          # Centered layout, no nav
│   │   │   └── login/
│   │   │       └── page.tsx        # Login page
│   │   │
│   │   └── (app)/                  # Route group: authenticated
│   │       ├── layout.tsx          # App shell (sidebar + bottom nav + FAB)
│   │       ├── dashboard/
│   │       │   └── page.tsx        # Weekly Dashboard (landing page)
│   │       ├── journal/
│   │       │   ├── page.tsx        # Journal home (today's status + timeline)
│   │       │   ├── new/
│   │       │   │   └── page.tsx    # Create entry (type passed as query param)
│   │       │   ├── [id]/
│   │       │   │   └── page.tsx    # View/edit single entry
│   │       │   └── timeline/
│   │       │       └── page.tsx    # Full timeline view
│   │       ├── fitness/
│   │       │   ├── page.tsx        # Fitness home (active program, this week)
│   │       │   ├── programs/
│   │       │   │   ├── page.tsx    # Programs list
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx  # Program detail (exercises)
│   │       │   ├── exercises/
│   │       │   │   └── page.tsx    # Exercise catalog
│   │       │   ├── session/
│   │       │   │   └── page.tsx    # Active workout session (timer + logging)
│   │       │   └── history/
│   │       │       ├── page.tsx    # Workout history list
│   │       │       └── [id]/
│   │       │           └── page.tsx  # Single workout detail
│   │       ├── projects/
│   │       │   └── page.tsx        # Projects (tabs for 3 boards)
│   │       ├── captures/
│   │       │   └── page.tsx        # Inbox
│   │       ├── calendar/
│   │       │   └── page.tsx        # Week view
│   │       └── settings/
│   │           └── page.tsx        # Settings page
│   │
│   ├── components/                 # Shared UI components
│   │   ├── ui/                     # Base design system components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── spinner.tsx
│   │   │   └── confirm-dialog.tsx
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── app-shell.tsx       # Main app layout (sidebar + content)
│   │   │   ├── bottom-nav.tsx      # Mobile bottom navigation
│   │   │   ├── sidebar.tsx         # Desktop/tablet side navigation
│   │   │   ├── top-bar.tsx         # Top bar with greeting/profile
│   │   │   └── fab.tsx             # Floating action button (quick capture)
│   │   │
│   │   ├── dashboard/             # Dashboard-specific components
│   │   │   ├── pending-actions.tsx
│   │   │   ├── today-events.tsx
│   │   │   ├── workout-week.tsx
│   │   │   ├── journal-status.tsx
│   │   │   ├── project-objectives.tsx
│   │   │   └── inbox-badge.tsx
│   │   │
│   │   ├── journal/               # Journal-specific components
│   │   │   ├── morning-pages-form.tsx
│   │   │   ├── reflection-form.tsx
│   │   │   ├── weekly-review-form.tsx
│   │   │   └── timeline-entry.tsx
│   │   │
│   │   ├── fitness/               # Fitness-specific components
│   │   │   ├── workout-timer.tsx
│   │   │   ├── exercise-card.tsx
│   │   │   ├── set-logger.tsx
│   │   │   ├── workout-summary.tsx
│   │   │   └── program-card.tsx
│   │   │
│   │   ├── projects/              # Project-specific components
│   │   │   ├── board-tabs.tsx
│   │   │   ├── task-list.tsx
│   │   │   ├── task-item.tsx
│   │   │   ├── task-form.tsx
│   │   │   └── note-editor.tsx
│   │   │
│   │   ├── captures/              # Capture-specific components
│   │   │   ├── capture-card.tsx
│   │   │   ├── capture-form.tsx
│   │   │   └── empty-inbox.tsx
│   │   │
│   │   └── calendar/              # Calendar-specific components
│   │       ├── week-view.tsx
│   │       ├── day-column.tsx
│   │       ├── event-block.tsx
│   │       └── event-form.tsx
│   │
│   ├── lib/                       # Utilities and configuration
│   │   ├── api-client.ts          # Fetch wrapper with auth handling
│   │   ├── constants.ts           # App constants, route paths
│   │   ├── utils.ts               # Date formatting, helpers
│   │   └── types.ts               # Shared TypeScript types (from API schemas)
│   │
│   ├── stores/                    # Client-side state (Zustand)
│   │   ├── auth-store.ts          # Auth state (user, isAuthenticated)
│   │   ├── capture-store.ts       # Quick capture modal state
│   │   └── workout-store.ts       # Active workout session state (timer)
│   │
│   └── hooks/                     # Custom React hooks
│       ├── use-api.ts             # Data fetching hook (SWR-like)
│       ├── use-auth.ts            # Auth state + actions
│       ├── use-keyboard.ts        # Keyboard shortcut handler
│       └── use-responsive.ts      # Breakpoint detection
│
├── Dockerfile
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 2. STATE MANAGEMENT

### Approach: Zustand for Client State + SWR for Server State

**Why Zustand (not Redux, not Jotai):**
- Minimal boilerplate (3-5 lines for a store)
- No providers or context wrappers needed
- TypeScript-native
- Perfect for small, isolated client state
- Single-user app does not need complex state management

**Why SWR for server state (not React Query):**
- Lighter weight, less configuration
- Built-in cache, revalidation, and deduplication
- Stale-while-revalidate pattern gives perceived performance
- Pairs naturally with the fetch-based API client

### What Goes Where

```
ZUSTAND (client-only state):
- auth-store.ts:     { user, isAuthenticated, login(), logout() }
- capture-store.ts:  { isModalOpen, openModal(), closeModal() }
- workout-store.ts:  { activeSession, elapsedSeconds, startTimer(), stopTimer() }

SWR (server state - cached API responses):
- Dashboard data        useSWR('/api/v1/dashboard/weekly')
- Journal entries       useSWR('/api/v1/journal/entries?...')
- Exercise list         useSWR('/api/v1/exercises')
- Program details       useSWR('/api/v1/programs/:id')
- Project board data    useSWR('/api/v1/projects/:slug')
- Captures inbox        useSWR('/api/v1/captures')
- Calendar events       useSWR('/api/v1/calendar/events?...')
```

### Auth Store Example

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  display_name: string;
  theme: 'light' | 'dark' | 'auto';
  week_start_day: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));
```

### Workout Timer Store Example

```typescript
// src/stores/workout-store.ts
import { create } from 'zustand';

interface WorkoutState {
  sessionId: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  intervalId: number | null;
  startSession: (sessionId: string) => void;
  tick: () => void;
  stopSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessionId: null,
  elapsedSeconds: 0,
  isRunning: false,
  intervalId: null,

  startSession: (sessionId) => {
    const id = window.setInterval(() => get().tick(), 1000);
    set({ sessionId, elapsedSeconds: 0, isRunning: true, intervalId: id });
  },

  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

  stopSession: () => {
    const { intervalId } = get();
    if (intervalId) window.clearInterval(intervalId);
    set({ sessionId: null, isRunning: false, intervalId: null });
  },
}));
```

---

## 3. API CLIENT

### Fetch Wrapper with Auto-Refresh

```typescript
// src/lib/api-client.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiError {
  detail: string;
  code: string;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${path}`;
    const config: RequestInit = {
      ...options,
      credentials: 'include',  // Send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    let response = await fetch(url, config);

    // If 401, try refreshing the token
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request
        response = await fetch(url, config);
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiClientError(error.detail, error.code, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    // Deduplicate concurrent refresh requests
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Convenience methods
  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export const api = new ApiClient();
```

### SWR Configuration

```typescript
// src/lib/swr-config.ts
import { SWRConfiguration } from 'swr';
import { api } from './api-client';

export const swrConfig: SWRConfiguration = {
  fetcher: (url: string) => api.get(url),
  revalidateOnFocus: true,      // Refresh when tab becomes active
  revalidateOnReconnect: true,  // Refresh when network reconnects
  dedupingInterval: 5000,       // Deduplicate requests within 5s
  errorRetryCount: 3,
};
```

### Data Fetching Hook Usage

```typescript
// In a component:
import useSWR from 'swr';

function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/dashboard/weekly'
  );

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState onRetry={() => mutate()} />;
  return <DashboardContent data={data} />;
}
```

---

## 4. AUTHENTICATION FLOW

### Protected Routes (Middleware)

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If no tokens at all, redirect to login (except if already there)
  if (!accessToken && !refreshToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If on login page but has tokens, redirect to dashboard
  if (isLoginPage && (accessToken || refreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico|icons|splash|manifest.json|sw.js|api).*)',
  ],
};
```

**Note:** The middleware checks for cookie presence only. Actual token validation happens on the backend. If the access token is expired but the refresh token exists, the API client handles the refresh transparently.

### Login Page Flow

```
1. User visits /login
2. Enters password, submits form
3. POST /api/auth/login { username: "samuel", password: "..." }
4. On success:
   - Backend sets httpOnly cookies
   - Frontend receives user data
   - Zustand store: setUser(user)
   - Router pushes to /dashboard
5. On failure:
   - Show error message
   - Clear password field
```

---

## 5. PWA SETUP

### manifest.json

```json
{
  "name": "Life OS",
  "short_name": "Life OS",
  "description": "Your Weekly Command Center",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#1A1A1A",
  "theme_color": "#2563EB",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Service Worker (Static Assets Only)

```javascript
// public/sw.js
// Simple static asset cache - NO offline page support

const CACHE_NAME = 'lifeos-static-v1';
const STATIC_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache static assets, let everything else go to network
  if (event.request.url.includes('/icons/') ||
      event.request.url.includes('/splash/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
  // All other requests: network only (no offline support in V1)
});
```

### Register Service Worker in Root Layout

```typescript
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build arguments for environment variables baked into the build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
```

### next.config.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',   // For Docker deployment
  reactStrictMode: true,
};

module.exports = nextConfig;
```

---

## 6. COMPONENT ORGANIZATION RULES

```
1. Page components (app/**/page.tsx):
   - Fetch data with SWR
   - Handle loading/error states
   - Compose from smaller components
   - Minimal direct JSX

2. Feature components (components/{module}/):
   - Contain module-specific UI logic
   - Can call API client for mutations
   - Can use Zustand stores
   - Can use SWR for data

3. UI components (components/ui/):
   - Pure presentational
   - Accept data via props
   - No API calls or store access
   - Styled with Tailwind
   - Reusable across modules
```

---

## 7. DEPLOYMENT STRATEGY

### 7.1 VPS Requirements (syrax)

```
OS:         Ubuntu 22.04 LTS (or similar)
RAM:        2 GB minimum (4 GB recommended)
CPU:        2 vCPUs
Storage:    20 GB SSD minimum
Ports:      80 (HTTP), 443 (HTTPS), 22 (SSH)
```

### 7.2 Nginx Reverse Proxy Configuration

```nginx
# nginx/nginx.conf

events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;

    # Upstream definitions
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name lifeos.yourdomain.com;

        # Certbot challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name lifeos.yourdomain.com;

        # SSL certificates (from Let's Encrypt / certbot)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options DENY always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API routes -> FastAPI backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Stricter rate limit for login
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Everything else -> Next.js frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 7.3 SSL/HTTPS Setup with Certbot

```bash
# Initial setup (run on VPS before starting with SSL)

# 1. Install certbot
sudo apt install certbot

# 2. Get certificates (stop nginx temporarily or use webroot)
# Option A: Standalone (if nginx is not running yet)
sudo certbot certonly --standalone -d lifeos.yourdomain.com

# Option B: Webroot (if nginx is already running with HTTP)
sudo certbot certonly --webroot -w /var/www/certbot -d lifeos.yourdomain.com

# 3. Copy certificates to the nginx volume location
sudo cp /etc/letsencrypt/live/lifeos.yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/lifeos.yourdomain.com/privkey.pem ./nginx/ssl/

# 4. Auto-renewal (add to crontab)
# crontab -e
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/lifeos.yourdomain.com/fullchain.pem /path/to/nginx/ssl/ && cp /etc/letsencrypt/live/lifeos.yourdomain.com/privkey.pem /path/to/nginx/ssl/ && docker compose restart nginx
```

### 7.4 Database Backup Strategy

```bash
#!/bin/bash
# scripts/backup-db.sh
# Run daily via cron: 0 2 * * * /path/to/backup-db.sh

BACKUP_DIR="/backups/lifeos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/lifeos_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump database through Docker
docker compose exec -T db pg_dump -U lifeos lifeos | gzip > "$BACKUP_FILE"

# Verify backup was created and is not empty
if [ -s "$BACKUP_FILE" ]; then
    echo "Backup successful: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    echo "ERROR: Backup file is empty!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Remove backups older than retention period
find "$BACKUP_DIR" -name "lifeos_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Cleanup complete. Backups older than ${RETENTION_DAYS} days removed."
```

**Backup restore:**
```bash
# Restore from backup
gunzip -c /backups/lifeos/lifeos_20260216_020000.sql.gz | \
  docker compose exec -T db psql -U lifeos lifeos
```

### 7.5 Deployment Commands

```bash
# Initial deployment
git clone <repo> /opt/lifeos
cd /opt/lifeos
cp .env.example .env
# Edit .env with production values

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f
docker compose logs -f backend    # Specific service

# Update deployment (after git pull)
docker compose up -d --build

# Database migration (runs automatically on backend start,
# but can be triggered manually)
docker compose exec backend alembic upgrade head

# Create/reset user password
docker compose exec backend python scripts/create_user.py

# Check status
docker compose ps

# Restart a single service
docker compose restart backend
```

### 7.6 Environment Variables Summary

```
Variable                    Service      Description
------------------------------------------------------------------
DB_PASSWORD                 db/backend   PostgreSQL password
SECRET_KEY                  backend      JWT signing key (hex, 64 chars)
FRONTEND_URL                backend      CORS origin (https://lifeos.yourdomain.com)
NEXT_PUBLIC_API_URL         frontend     API base URL (same as FRONTEND_URL)
DEBUG                       backend      Enable debug mode (false in production)
COOKIE_SECURE               backend      Require HTTPS for cookies (true in prod)
DATABASE_URL                backend      Full PostgreSQL connection string
NODE_ENV                    frontend     Node environment (production)
```

---

## 8. IMPLEMENTATION PLAN

### Phase 1: Foundation (Week 1)

```
Backend:
  [ ] Project scaffolding (FastAPI, folder structure, config)
  [ ] Database setup (SQLAlchemy models, Alembic init)
  [ ] Initial migration (all tables)
  [ ] Auth system (login, logout, refresh, password)
  [ ] Docker setup (Dockerfile, docker-compose.yml)
  [ ] Seed script (create user, default projects)

Frontend:
  [ ] Next.js project setup (App Router, Tailwind, Zustand, SWR)
  [ ] Base UI components (button, card, input, modal)
  [ ] Layout components (app shell, sidebar, bottom nav, top bar)
  [ ] Login page
  [ ] Auth flow (middleware, API client, token refresh)
  [ ] PWA setup (manifest, service worker)

DevOps:
  [ ] VPS initial setup (Docker, Docker Compose)
  [ ] DNS configuration
  [ ] Nginx configuration
  [ ] SSL certificate setup
```

### Phase 2: Dashboard + Core Modules (Week 2-3)

```
Backend:
  [ ] Dashboard aggregation endpoint
  [ ] Journal CRUD + status/streak endpoints
  [ ] Captures CRUD + external API endpoint
  [ ] Calendar CRUD + recurrence materialization

Frontend:
  [ ] Weekly Dashboard (all widgets)
  [ ] FAB (floating action button) for quick capture
  [ ] Journal pages (create, view, edit, timeline)
  [ ] Captures inbox page
  [ ] Calendar week view + event CRUD
  [ ] Quick capture modal
```

### Phase 3: Fitness + Projects (Week 4-5)

```
Backend:
  [ ] Exercise CRUD
  [ ] Program CRUD + exercise management
  [ ] Workout session lifecycle (start, log, complete, cancel)
  [ ] Workout history
  [ ] Project CRUD
  [ ] Task CRUD + reordering + status changes
  [ ] Project notes CRUD

Frontend:
  [ ] Fitness home page
  [ ] Exercise catalog management
  [ ] Program management (create, edit, exercises)
  [ ] Workout session page (timer, set logging, completion)
  [ ] Workout history
  [ ] Projects page (3 boards with tabs)
  [ ] Task management (add, complete, move, drag-and-drop)
  [ ] Project notes
```

### Phase 4: Settings + Polish (Week 6)

```
Backend:
  [ ] Settings endpoints (preferences, API keys, export)
  [ ] Cleanup jobs (expired refresh tokens)
  [ ] Error handling polish

Frontend:
  [ ] Settings page (theme, API keys, export, password change)
  [ ] Onboarding flow (first-time setup wizard)
  [ ] Empty states for all modules
  [ ] Error states and toast notifications
  [ ] Loading skeletons
  [ ] Responsive design testing (mobile, tablet, desktop)
  [ ] Keyboard shortcuts (Cmd+K, Cmd+1-6, Esc)
  [ ] Animations (task completion, workout complete)
```

### Phase 5: Testing + Deployment (Week 7)

```
Backend:
  [ ] Unit tests for services
  [ ] Integration tests for API endpoints
  [ ] Test coverage > 80%

Frontend:
  [ ] Cross-browser testing (Safari, Chrome, Firefox)
  [ ] Cross-device testing (iPhone, iPad, Mac)
  [ ] PWA installation testing
  [ ] Performance audit (Lighthouse)

DevOps:
  [ ] Production deployment
  [ ] Backup automation setup
  [ ] Monitoring (basic health checks)
  [ ] SSL auto-renewal verification
```

---

## 9. TECHNICAL DECISIONS LOG

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single vs. multi-table journal | Single table + JSONB | Simplifies timeline queries, avoids JOINs for mixed entry types |
| Calendar recurrence model | Materialized instances | Simpler queries, supports per-instance edits, acceptable row count for single user |
| Auth for browser | httpOnly JWT cookies | Prevents XSS token theft. SameSite=Lax prevents CSRF for state-changing requests |
| Auth for external API | Bearer token (hashed) | Standard pattern for Siri Shortcuts. Token shown once, hash stored |
| ORM | SQLAlchemy 2.0 async | Type-safe queries, async support, migration tooling via Alembic |
| Frontend router | Next.js App Router | Nested layouts, loading states, route groups for auth |
| Server state | SWR | Lightweight, stale-while-revalidate for perceived performance |
| Client state | Zustand | Minimal boilerplate, no providers, perfect for 3 small stores |
| Styling | Tailwind CSS | Rapid development, consistent design tokens, small bundle |
| Task ordering | sort_order column | Enables drag-and-drop reordering without rewriting all rows |
| Workout logs | One row per set | Granular data, supports per-set weight tracking, simple queries |
| API versioning | /api/v1/ prefix | Allows future breaking changes without disrupting existing clients |
| Soft vs hard delete (captures) | Soft delete (status field) | Prevents accidental data loss. Hard delete available as explicit action |
| Program deletion | SET NULL on sessions | Preserves workout history even if program definition changes |
| Exercise deletion | RESTRICT if in program | Prevents orphaned program references. User must clean up first |

---

## 10. OUT OF SCOPE (NOT IN V1)

```
Technical features explicitly deferred:

[ ] Offline support / IndexedDB sync       - Online-only for V1
[ ] Push notifications                     - No service worker push
[ ] WebSocket / real-time updates          - Single user, polling is fine
[ ] Full-text search                       - Small dataset, browser search works
[ ] File uploads / image attachments       - Text only in V1
[ ] CSV/PDF export                         - JSON export covers backup needs
[ ] Analytics / charts / progress graphs   - V2 feature (tracking first)
[ ] Email notifications                    - Single user, not needed
[ ] Rate limiting per API key              - Single user with 1-2 keys
[ ] Database connection pooling (PgBouncer)- Low traffic, direct connection fine
[ ] CDN for static assets                  - Self-hosted, Nginx handles it
[ ] CI/CD pipeline                         - Manual deployment via docker compose
[ ] Database replication                   - Single VPS, backups are sufficient
[ ] Caching layer (Redis)                  - Low traffic, DB queries are fast
[ ] Complex recurrence (monthly, yearly)   - Weekly only in V1
[ ] Multi-user / sharing                   - Single user system
```
