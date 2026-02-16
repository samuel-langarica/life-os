# Captures Module - Frontend Architecture

## Component Hierarchy

```
App Root
│
└── (authenticated) Layout
    │
    ├── AppShell
    │   ├── Sidebar (desktop)
    │   ├── TopBar
    │   ├── Main Content
    │   │   ├── Dashboard Page
    │   │   │   └── WeeklyDashboard
    │   │   │       └── InboxWidget ✨
    │   │   │           ├── useSWR('/api/v1/captures/count')
    │   │   │           └── Link to /captures
    │   │   │
    │   │   └── Captures Page ✨
    │   │       ├── useSWR('/api/v1/captures')
    │   │       ├── CaptureCard (multiple)
    │   │       │   ├── Copy button
    │   │       │   ├── Done button
    │   │       │   └── Delete button
    │   │       └── Empty state
    │   │
    │   └── BottomNav (mobile)
    │
    ├── QuickCaptureModal ✨
    │   ├── Modal overlay (z-50)
    │   ├── Capture form
    │   │   ├── Textarea (auto-focused)
    │   │   └── Action buttons
    │   └── useCaptureStore (state)
    │
    └── FloatingCaptureButton ✨
        ├── Fixed position (z-40)
        └── Opens modal via useCaptureStore

✨ = New components
```

## Data Flow

### Creating a Capture

```
User clicks [+] button
        ↓
FloatingCaptureButton
        ↓
useCaptureStore.openModal()
        ↓
QuickCaptureModal renders
        ↓
User types text
        ↓
User submits form
        ↓
capturesApi.create(text, 'manual')
        ↓
POST /api/v1/captures
        ↓
Backend creates capture
        ↓
mutate('/api/v1/captures')        ← Invalidate list cache
mutate('/api/v1/captures/count')  ← Invalidate count cache
        ↓
SWR refetches data
        ↓
Dashboard count updates
Captures list updates
```

### Processing a Capture

```
User on Captures page
        ↓
Clicks "Done" button
        ↓
capturesApi.update(id, { processed: true })
        ↓
PATCH /api/v1/captures/:id
        ↓
Backend marks as processed
        ↓
mutate('/api/v1/captures')        ← Invalidate cache
mutate('/api/v1/captures/count')  ← Invalidate cache
        ↓
SWR refetches data
        ↓
Capture disappears from list
Count decrements
```

## State Management

### Zustand Store (Modal State)

```typescript
useCaptureStore
├── isModalOpen: boolean
├── openModal: () => void
└── closeModal: () => void
```

**Used by:**
- FloatingCaptureButton (opens modal)
- QuickCaptureModal (reads state, closes modal)

### SWR Cache (Data State)

```typescript
Cache Keys:
├── '/api/v1/captures'        → List of unprocessed captures
└── '/api/v1/captures/count'  → Count of unprocessed captures

Mutated by:
├── Create capture → Both keys
├── Mark done      → Both keys
└── Delete capture → Both keys
```

## API Client Architecture

```
Component
    ↓
capturesApi.{method}()
    ↓
api.{get|post|patch|delete}()
    ↓
fetch() with credentials
    ↓
If 401 → refreshToken()
    ↓
If success → return data
If error → throw ApiClientError
```

### API Methods

```typescript
capturesApi
├── list(includeProcessed)    → GET  /api/v1/captures
├── create(text, source)      → POST /api/v1/captures
├── update(id, data)          → PATCH /api/v1/captures/:id
├── delete(id)                → DELETE /api/v1/captures/:id
└── getCount()                → GET  /api/v1/captures/count
```

## File Dependencies

```
QuickCaptureModal.tsx
├── import { useCaptureStore } from '@/stores/capture-store'
├── import { capturesApi } from '@/lib/api/captures'
├── import { Button } from '@/components/ui/button'
└── import { useSWRConfig } from 'swr'

FloatingCaptureButton.tsx
└── import { useCaptureStore } from '@/stores/capture-store'

Captures page.tsx
├── import useSWR from 'swr'
├── import { capturesApi } from '@/lib/api/captures'
├── import { Button } from '@/components/ui/button'
├── import { formatDate } from '@/lib/utils'
└── import { useSWRConfig } from 'swr'

InboxWidget.tsx
├── import useSWR from 'swr'
├── import { capturesApi } from '@/lib/api/captures'
├── import { Card } from '@/components/ui/card'
└── import { Button } from '@/components/ui/button'

captures.ts (API client)
└── import { api } from '@/lib/api-client'
```

## Routing

```
User navigates to:

/ (root)
    ↓ Redirects to
/dashboard
    ↓ Shows
WeeklyDashboard
    └── InboxWidget
        └── Click "Process Now"
            ↓ Navigates to
/captures
    ↓ Shows
Captures Page
    └── List of captures
```

## Z-Index Layers

```
Layer 50: QuickCaptureModal (topmost)
Layer 40: FloatingCaptureButton
Layer 30: BottomNav (existing)
Layer 20: TopBar (existing)
Layer 10: Sidebar (existing)
Layer 0:  Page content
```

## Mobile Responsive Behavior

```
Mobile (< 768px)
├── Floating button bottom-20 (above BottomNav)
├── Modal full-screen with margins
├── Capture cards stack vertically
└── Action buttons in row (responsive text)

Desktop (>= 768px)
├── Floating button bottom-6
├── Modal centered, max-w-lg
├── Capture cards max-w-4xl
└── Action buttons with hover states
```

## Error Handling Flow

```
API Call
    ↓
Try
    ├─ Success → Update UI
    │           → Mutate cache
    │           → Close modal
    └─ Error → Catch
               ├─ Log to console
               ├─ Show alert (for now)
               └─ Keep modal open
```

## Performance Optimizations

### SWR Features Used
- Automatic revalidation on focus
- Automatic revalidation on reconnect
- Deduplication of requests
- Cache invalidation on mutations

### React Optimizations
- Components are client-side only ('use client')
- No unnecessary re-renders
- Zustand selectors prevent over-rendering
- Form state local to component

## Security

### Authentication
- Cookie-based auth (httpOnly cookies)
- Automatic token refresh on 401
- Credentials sent with every request
- CSRF protection via SameSite cookies

### Input Validation
- Text sanitization (backend)
- XSS prevention (React auto-escapes)
- No inline HTML rendering
- Whitespace preserved with `whitespace-pre-wrap`

## Accessibility

### Keyboard Support
- ESC closes modal
- Tab navigation works
- Enter submits form
- Focus management on modal open

### Screen Readers
- Semantic HTML elements
- ARIA labels on buttons
- Proper heading hierarchy
- Alt text where needed

## Future Improvements

### Performance
- Virtual scrolling for long lists
- Debounced search
- Optimistic UI updates
- Offline support with service worker

### UX
- Toast notifications
- Swipe gestures on mobile
- Keyboard shortcuts (Cmd+K)
- Bulk operations
- Undo/redo

### Features
- Rich text editing
- Tags and categories
- Search and filter
- Export captures
- Attachments

---

This architecture is designed to be:
- **Scalable**: Easy to add new capture sources
- **Maintainable**: Clear separation of concerns
- **Performant**: Optimized data fetching and caching
- **Testable**: Pure functions and isolated components
- **Accessible**: Keyboard and screen reader support
