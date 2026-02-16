# Life OS Frontend

Next.js 14+ frontend for Life OS - Your Weekly Command Center.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, set this to your production API URL.

### Building for Production

```bash
npm run build
npm start
```

### Docker Build

```bash
docker build -t lifeos-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://your-domain.com \
  .

docker run -p 3000:3000 lifeos-frontend
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Unauthenticated routes
│   │   │   └── login/
│   │   ├── (authenticated)/   # Authenticated routes
│   │   │   ├── dashboard/
│   │   │   ├── journal/
│   │   │   ├── fitness/
│   │   │   ├── projects/
│   │   │   ├── captures/
│   │   │   ├── calendar/
│   │   │   └── settings/
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   ├── auth/              # Auth components
│   │   ├── dashboard/         # Dashboard components
│   │   └── layout/            # Layout components
│   ├── lib/
│   │   ├── api-client.ts      # API client with auth
│   │   ├── types.ts           # TypeScript types
│   │   ├── utils.ts           # Utility functions
│   │   └── constants.ts       # App constants
│   └── stores/                # Zustand stores
│       ├── auth-store.ts
│       ├── capture-store.ts
│       └── workout-store.ts
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
└── package.json
```

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + Radix UI primitives
- **State Management**: Zustand (client state) + SWR (server state)
- **Authentication**: httpOnly cookies
- **PWA**: Service Worker for static asset caching

## Key Features

- Server-side rendering with Next.js App Router
- Cookie-based authentication with auto-refresh
- Progressive Web App (PWA) support
- Responsive design (mobile-first)
- Type-safe API client
- Global state management with Zustand
- Data fetching and caching with SWR

## Development Notes

### Authentication Flow

1. User logs in via `/login`
2. Backend sets httpOnly cookies
3. Middleware checks for cookies on protected routes
4. API client handles token refresh automatically

### Route Protection

Routes are protected using Next.js middleware. The middleware checks for access/refresh tokens and redirects:
- No tokens → `/login`
- Has tokens but on `/login` → `/dashboard`

### API Client

The API client (`src/lib/api-client.ts`) handles:
- Automatic token refresh on 401
- Request deduplication
- Error handling
- Cookie credentials

### State Management

- **Zustand**: Used for client-only state (auth, modals, timers)
- **SWR**: Used for server state (API data fetching and caching)

## Available Routes

- `/login` - Login page
- `/dashboard` - Weekly dashboard overview
- `/journal` - Journal entries
- `/fitness` - Workout tracking
- `/projects` - Project management
- `/captures` - Quick captures inbox
- `/calendar` - Week view calendar
- `/settings` - User settings

## PWA Installation

The app can be installed as a PWA on supported devices:

1. Open the app in a browser
2. Look for "Install" or "Add to Home Screen"
3. Follow the prompts

Note: V1 requires internet connection (no offline support).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - Not for distribution
