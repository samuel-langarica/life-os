# Command Redesign Implementation Guide

Complete guide to transforming Life OS into **Command** - a premium, professional productivity system.

---

## Step 1: Install Dependencies

```bash
cd /Users/samuel/life-os/frontend
npm install lucide-react
```

---

## Step 2: Core Files (Already Updated)

✅ `globals.css` - Premium dark theme with Geist fonts
✅ `tailwind.config.ts` - Updated with new fonts and animations
✅ `COMMAND_DESIGN_SYSTEM.md` - Complete design reference

---

## Step 3: Update Root Layout

**File:** `src/app/layout.tsx`

Replace "Life OS" with "Command" in metadata:

```tsx
export const metadata: Metadata = {
  title: 'Command',
  description: 'Your personal operating system for productivity',
  manifest: '/manifest.json',
};
```

---

## Step 4: Update Navigation Components

### Sidebar (Desktop)

**File:** `src/components/layout/Sidebar.tsx`

```tsx
import { Inbox, Calendar, BookOpen, Target, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm">
      <div className="p-6">
        <h1 className="text-xl font-semibold tracking-tight mb-8">COMMAND</h1>

        <nav className="space-y-1">
          <NavItem href="/dashboard" icon={<Calendar />} label="Dashboard" />
          <NavItem href="/captures" icon={<Inbox />} label="Inbox" />
          <NavItem href="/calendar" icon={<Calendar />} label="Calendar" />
          <NavItem href="/journal" icon={<BookOpen />} label="Journal" />
          <NavItem href="/projects" icon={<Target />} label="Projects" />
        </nav>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <NavItem href="/settings" icon={<Settings />} label="Settings" />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-150 group"
    >
      <span className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </span>
      {label}
    </Link>
  );
}
```

### Bottom Navigation (Mobile)

**File:** `src/components/layout/BottomNav.tsx`

```tsx
import { Inbox, Calendar, BookOpen, Target, Home } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex justify-around items-center h-16">
        <NavIcon href="/dashboard" icon={<Home size={20} />} label="Home" />
        <NavIcon href="/captures" icon={<Inbox size={20} />} label="Inbox" />
        <NavIcon href="/calendar" icon={<Calendar size={20} />} label="Calendar" />
        <NavIcon href="/journal" icon={<BookOpen size={20} />} label="Journal" />
        <NavIcon href="/projects" icon={<Target size={20} />} label="Projects" />
      </div>
    </nav>
  );
}

function NavIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
```

---

## Step 5: Update Dashboard

**File:** `src/app/(authenticated)/dashboard/page.tsx`

```tsx
import { Calendar, Inbox, BookOpen, Target } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Week of February 16-22, 2026</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InboxWidget />
        <CalendarWidget />
        <JournalWidget />
        <ProjectsWidget />
      </div>
    </div>
  );
}
```

### InboxWidget

**File:** `src/components/dashboard/InboxWidget.tsx`

```tsx
import { Inbox } from 'lucide-react';
import Link from 'next/link';

export function InboxWidget() {
  const { data } = useSWR('/api/v1/captures/count', capturesApi.getCount);
  const count = data?.count || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Inbox size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Inbox</h2>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-semibold tabular-nums">{count}</div>
        <p className="text-sm text-muted-foreground">
          {count === 0 ? 'Inbox clear' : count === 1 ? 'item to process' : 'items to process'}
        </p>
      </div>

      {count > 0 && (
        <Link
          href="/captures"
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Process now →
        </Link>
      )}
    </div>
  );
}
```

### CalendarWidget

**File:** `src/components/dashboard/CalendarWidget.tsx`

```tsx
import { Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function CalendarWidget() {
  const { events } = useCalendar();
  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '50ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Calendar size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">This Week</h2>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events scheduled</p>
        ) : (
          upcomingEvents.map(event => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="text-xs font-mono text-muted-foreground pt-0.5 w-12">
                {formatTime(event.start_time)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(event.event_date)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        href="/calendar"
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        View week →
      </Link>
    </div>
  );
}
```

### JournalWidget

**File:** `src/components/dashboard/JournalWidget.tsx`

```tsx
import { BookOpen, Flame, Sunrise, Moon } from 'lucide-react';
import Link from 'next/link';

export function JournalWidget() {
  const { data: status } = useSWR('/api/v1/journal/status', journalApi.getStatus);

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <BookOpen size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Journal</h2>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sunrise size={16} className="text-muted-foreground" />
            <span className="text-sm">Morning pages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-medium tabular-nums">{status?.morning_pages_streak || 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-muted-foreground" />
            <span className="text-sm">Daily reflection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-medium tabular-nums">{status?.daily_reflection_streak || 0}</span>
          </div>
        </div>
      </div>

      <Link
        href="/journal"
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Write now →
      </Link>
    </div>
  );
}
```

### ProjectsWidget

**File:** `src/components/dashboard/ProjectsWidget.tsx`

```tsx
import { Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function ProjectsWidget() {
  const { data } = useSWR('/api/v1/projects', projectsApi.list);
  const projects = data || [];

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Target size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {projects.map(project => {
          const inProgressCount = project.tasks.filter(t => t.status === 'in_progress').length;

          return (
            <div key={project.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {project.objective || 'No objective set'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1 tabular-nums">
                    {inProgressCount} in progress
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/projects"
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Manage projects →
      </Link>
    </div>
  );
}
```

---

## Step 6: Update PWA Manifest

**File:** `public/manifest.json`

```json
{
  "name": "Command",
  "short_name": "Command",
  "description": "Your personal operating system for productivity",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#F59E0B",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Step 7: Update Floating Capture Button

**File:** `src/components/captures/FloatingCaptureButton.tsx`

```tsx
import { Plus } from 'lucide-react';

export function FloatingCaptureButton() {
  const { openQuickCapture } = useCapturesStore();

  return (
    <button
      onClick={openQuickCapture}
      className="fixed bottom-20 right-6 md:bottom-6 md:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 hover:scale-105 transition-all duration-200 flex items-center justify-center z-40 group"
      aria-label="Quick Capture"
    >
      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200" />
    </button>
  );
}
```

---

## Step 8: Additional File Updates Needed

### Remove Emojis From:

1. **Captures Page** (`src/app/(authenticated)/captures/page.tsx`)
   - Remove 📥 emoji
   - Replace with `<Inbox />` icon

2. **Calendar Page** (`src/app/(authenticated)/calendar/page.tsx`)
   - Remove 📅 emoji
   - Replace with `<Calendar />` icon

3. **Journal Pages** (all journal-related pages)
   - Remove 📓, 🌅, 🌙, 🔥 emojis
   - Replace with `<BookOpen />`, `<Sunrise />`, `<Moon />`, `<Flame />` icons

4. **Projects Page** (`src/app/(authenticated)/projects/page.tsx`)
   - Remove 🎯 emoji
   - Replace with `<Target />` icon

5. **All Modals and Buttons**
   - Replace ➕ with `<Plus />`
   - Replace ✏️ with `<Pencil />`
   - Replace 🗑️ with `<Trash2 />`
   - Replace ✓ with `<Check />`

---

## Quick Reference: Common Icon Replacements

```tsx
import {
  Inbox,
  Calendar,
  BookOpen,
  Target,
  Flame,
  Check,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Moon,
  Settings,
  Repeat,
} from 'lucide-react';

// Usage
<Inbox size={20} className="text-primary" />
<Calendar size={16} />
<Flame size={14} className="text-primary" />
```

---

## Testing Checklist

After implementation:

- [ ] Run `npm install lucide-react`
- [ ] Restart dev server (`npm run dev`)
- [ ] Check dark theme loads correctly
- [ ] Verify Geist font loads
- [ ] Test all navigation (no emojis visible)
- [ ] Check dashboard widgets (icons instead of emojis)
- [ ] Test all module pages
- [ ] Verify floating action button (Plus icon)
- [ ] Check mobile responsive (bottom nav icons)
- [ ] Test animations (hover, transitions)
- [ ] Verify focus rings (amber accent)

---

## Build and Deploy

```bash
# Build
npm run build

# Check for errors
# All emojis should be replaced with icons
```

---

## Brand Guidelines

**Voice:**
- Professional, not playful
- Precise, not wordy
- Empowering, not pushy

**Copy Examples:**
- ❌ "🎉 You're crushing it!"
- ✅ "All tasks completed"
- ❌ "Inbox Zero! 📥✨"
- ✅ "Inbox clear"

---

**That's it!** Your productivity system is now **Command** - professional, premium, and emoji-free.
