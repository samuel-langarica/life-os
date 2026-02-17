# Command Design System

> Your personal operating system for productivity

## Overview

**Command** is a refined, professional productivity system with zero emojis and a premium dark-first aesthetic. Inspired by Linear, Raycast, and Swiss design principles.

---

## Branding

**Name:** Command
**Tagline:** Your personal operating system
**Tone:** Professional, precise, empowering

### Logo/Wordmark
```
COMMAND
```
- Font: Geist 600 weight
- Letter spacing: -0.02em
- Size: 24px (desktop), 20px (mobile)

---

## Color Palette

### Dark Theme (Default) - `:root`
```css
--background: 0 0% 4%              /* #0A0A0A - Deep charcoal */
--foreground: 0 0% 98%             /* #FAFAFA - High contrast white */
--card: 240 6% 10%                 /* #18181B - Elevated surfaces */
--primary: 38 92% 50%              /* #F59E0B - Warm amber (actions) */
--secondary: 240 5% 15%            /* #27272A - Subtle surfaces */
--muted-foreground: 215 16% 47%    /* #64748B - Muted text */
--border: 240 4% 16%               /* #27272A - Subtle borders */
--destructive: 0 72% 51%           /* #E11D48 - Rose red (danger) */
```

### Light Theme - `.light` class on `<html>`
```css
--background: 0 0% 100%            /* #FFFFFF */
--foreground: 240 10% 4%           /* #09090B */
--card: 0 0% 100%                  /* #FFFFFF */
--primary: 38 92% 50%              /* #F59E0B - Amber (same) */
--secondary: 240 5% 96%            /* #F4F4F5 */
--muted-foreground: 240 4% 46%     /* #71717A */
--border: 240 6% 90%               /* #E4E4E7 */
--destructive: 0 72% 51%           /* #E11D48 (same) */
```

Theme is toggled via `ThemeToggle` component in TopBar. Persisted in localStorage.

### Usage
- **Primary (Amber):** CTAs, active states, important actions
- **Foreground:** Primary text, headings
- **Muted:** Secondary text, labels, timestamps
- **Border:** Subtle dividers, card outlines
- **Destructive:** Delete, warnings

---

## Typography

### Font Stack
```css
font-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
font-mono: 'Berkeley Mono', 'JetBrains Mono', monospace
```

### Scale
```
H1: 28px / 600 weight / -0.02em tracking
H2: 20px / 600 weight / -0.02em tracking
H3: 16px / 600 weight / -0.01em tracking
Body: 15px / 400 weight / normal tracking
Small: 13px / 400 weight / normal tracking
Mono: 14px / 400 weight / normal tracking (dates, numbers)
```

---

## Icon System

**Library:** Lucide Icons
**Size:** 20px default, 16px small, 24px large
**Stroke:** 2px
**Color:** currentColor (inherits text color)

### Icon Mapping (Emoji Replacement)

| Old Emoji | New Icon | Lucide Component |
|-----------|----------|------------------|
| 📥 Inbox | `<Inbox />` | Inbox |
| 📅 Calendar | `<Calendar />` | Calendar |
| 📓 Journal | `<BookOpen />` | BookOpen |
| 💪 Fitness | `<Dumbbell />` | Dumbbell |
| 🎯 Projects | `<Target />` | Target |
| 🔥 Streak | `<Flame />` | Flame |
| ✓ Complete | `<Check />` | Check |
| ➕ Add | `<Plus />` | Plus |
| ✏️ Edit | `<Pencil />` | Pencil |
| 🗑️ Delete | `<Trash2 />` | Trash2 |
| 📋 Copy | `<Copy />` | Copy |
| ← Back | `<ChevronLeft />` | ChevronLeft |
| → Forward | `<ChevronRight />` | ChevronRight |
| 🌅 Morning | `<Sunrise />` | Sunrise |
| 🌙 Evening | `<Moon />` | Moon |
| ⚙️ Settings | `<Settings />` | Settings |
| 🔁 Recurring | `<Repeat />` | Repeat |

---

## Components

### Button Variants

**Primary (Amber)**
```tsx
<button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-150 hover-lift">
  Primary Action
</button>
```

**Secondary (Ghost)**
```tsx
<button className="px-4 py-2 text-foreground hover:bg-secondary/50 rounded-lg font-medium transition-all duration-150">
  Secondary Action
</button>
```

**Destructive**
```tsx
<button className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-all duration-150">
  Delete
</button>
```

### Card
```tsx
<div className="bg-card border border-border rounded-xl p-6 hover-lift">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground text-sm">Card content</p>
</div>
```

### Input
```tsx
<input
  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus-ring text-foreground placeholder:text-muted-foreground"
  placeholder="Enter text..."
/>
```

---

## Animations

### Principles
- **Subtle:** No bouncing, no spinning
- **Fast:** 150-250ms transitions
- **Purposeful:** Enhance UX, don't distract

### Utilities
```css
.animate-fade-in      /* 300ms fade in */
.animate-slide-up     /* 400ms slide + fade */
.animate-scale-in     /* 200ms scale + fade */
.hover-lift           /* -2px hover lift */
.focus-ring           /* Amber focus ring */
```

---

## Layout Patterns

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Widgets */}
</div>
```

### Sidebar Navigation
```tsx
<nav className="w-64 border-r border-border p-6">
  <div className="mb-8">
    <h1 className="text-xl font-semibold tracking-tight">COMMAND</h1>
  </div>
  {/* Nav items */}
</nav>
```

### Content Area
```tsx
<main className="flex-1 p-8 max-w-7xl mx-auto">
  <h1 className="text-2xl font-semibold mb-6">Page Title</h1>
  {/* Content */}
</main>
```

---

## Module-Specific Styling

### Captures (Inbox)
- Icon: `<Inbox />`
- Accent: Amber on hover
- Empty state: Minimalist "Inbox clear"

### Calendar
- Icon: `<Calendar />`
- Week grid with subtle borders
- Today: Amber accent border
- Events: Card-based, subtle shadow

### Journal
- Icon: `<BookOpen />`
- Entry types with distinct icons:
  - Morning Pages: `<Sunrise />`
  - Daily Reflection: `<Moon />`
  - Weekly Review: `<CheckCircle />`
- Streaks: `<Flame />` with count

### Projects
- Icon: `<Target />`
- Board tabs: Underline active with amber
- Kanban columns: Subtle background differences
- Drag state: Opacity 0.5, amber border

---

## Spacing Scale

```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

---

## Shadows

**Subtle (cards)**
```css
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.3)
```

**Medium (modals)**
```css
box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.5)
```

---

## Brand Voice

**Do:**
- Use precise, clear language
- Focus on actions and outcomes
- Be empowering and confident

**Don't:**
- Use emojis or excessive punctuation
- Be playful or casual
- Use jargon or buzzwords

**Example Copy:**
- ❌ "🎉 You're crushing it! 💪"
- ✅ "All tasks completed"
- ❌ "Morning Pages - Not written today 😢"
- ✅ "Morning pages pending"
- ❌ "Inbox Zero! 📥✨"
- ✅ "Inbox clear"

---

## Resources

- [Lucide Icons](https://lucide.dev/)
- [Geist Font](https://vercel.com/font)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Version:** 1.0
**Last Updated:** 2026-02-16
