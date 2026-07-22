# LifeOS — Design System

> Design tokens, component patterns, and visual language for LifeOS — a personal
> local-first life operating system. This document is the source of truth for
> UI decisions. It reflects what is built and guides what comes next.
>
> **Last updated:** 2026-07-22

## Overview

LifeOS is an always-on instrument panel for one person. It lives on a secondary
monitor and answers one question above all others: **what should I be doing
right now?**

The visual language is intentionally constrained. It is not a marketing site,
not a social app, and not a general-purpose productivity tool. It is a dark,
quiet cockpit — built to reduce friction between deciding to act and acting.

**Key characteristics:**

- Dark background by default — designed for a monitor that's on all day, not a
  phone glanced outdoors.
- Typographic hierarchy driven by task priority, not visual decoration.
- Low-chrome UI: borders and spacing do the layout work; shadows are rare.
- Accent color = active state. Blue indicates "now," green indicates "done,"
  red indicates "needs attention."
- Every screen is a list or a card grid. No canvas, no drag-and-drop, no
  decorative illustration.

---

## Color

### Background & Surface

The app is dark. Light surfaces are used only for secondary/editorial contexts
(skills detail screens, finance ledgers, news reader) and are kept next to
white to preserve readability for longer reading sessions.

| Token                     | Value         | Use                                                       |
| ------------------------- | ------------- | --------------------------------------------------------- |
| `bg-app`                  | `#030712`     | Page background (gray-950)                                |
| `bg-card`                 | `#1f2937`     | Card / panel surface (gray-800)                           |
| `bg-card-hover`           | `#374151`     | Card hover state (gray-700)                               |
| `bg-input`                | `#374151`     | Form input background (gray-700)                          |
| `bg-surface-light`        | `#ffffff`     | Light-mode card surface (white)                           |
| `bg-surface-light-hover`  | `#f9fafb`     | Light-mode hover (gray-50)                                |

### Text

| Token              | Value     | Use                                        |
| ------------------ | --------- | ------------------------------------------ |
| `text-primary`     | `#f3f4f6` | High-emphasis body (gray-100)              |
| `text-secondary`   | `#9ca3af` | Metadata, labels, placeholders (gray-400)  |
| `text-muted`       | `#6b7280` | De-emphasized, empty states (gray-500)     |

### Accent / Semantic

| Token            | Value     | Use                                                     |
| ---------------- | --------- | ------------------------------------------------------- |
| `accent-blue`    | `#3b82f6` | Now card, active timer, primary CTA, links (blue-500)   |
| `accent-blue-bg` | `#2563eb` | Primary button fill, active tab (blue-600)              |
| `accent-green`   | `#22c55e` | Done status, habit logged, income (green-500)           |
| `accent-red`     | `#ef4444` | Errors, delete, overdue, expenses (red-500)             |
| `accent-yellow`  | `#eab308` | Skipped status, paused state, rest timer (yellow-500)   |
| `accent-orange`  | `#f97316` | Streaks, fire icon, habit energy (orange-500)           |

### Category colors (task left-border accents)

| Category   | Color      |
| ---------- | ---------- |
| Work       | Blue-500   |
| Workout    | Red-500    |
| Learning   | Purple-500 |
| Habit      | Orange-500 |
| Personal   | Pink-500   |
| General    | Gray-500   |

### Status badges

| Status       | Background    | Text          |
| ------------ | ------------- | ------------- |
| Planned      | `bg-gray-700` | `text-gray-300` |
| In Progress  | `bg-blue-900` | `text-blue-300` |
| Done         | `bg-green-900`| `text-green-300` |
| Skipped      | `bg-yellow-900`| `text-yellow-300` |

---

## Typography

### Font Family

- **UI**: system-ui / `ui-sans-serif` (no custom fonts — avoids extra weight
  for a single-user app). Tailwind `font-sans` resolves to the system stack.
- **Monospace**: `ui-monospace` for countdown timers, durations, and technical
  labels.

### Hierarchy

| Role              | Size    | Weight | Letter-spacing | Use                                    |
| ----------------- | ------- | ------ | -------------- | -------------------------------------- |
| App Title         | `xl`    | 700    | —              | "LifeOS" page heading (text-3xl)       |
| Card Heading      | `lg`    | 600    | —              | Task title, habit name, section header |
| Card Subheading   | `xs`    | 500    | `wide`         | "Now" / "Next" label, uppercase        |
| Body              | `sm`    | 400    | —              | Form labels, descriptions, metadata    |
| Caption           | `xs`    | 400    | —              | Countdown digits, timestamps, badges   |
| Mono Timer        | `2xl`   | 400    | —              | Live countdown in NowCard              |

### Principles

- Keep heading weights moderate (600–700). Let spacing and surface contrast,
  not boldness, create hierarchy.
- Use uppercase tracking for labels that identify a card's role ("NOW", "NEXT").
- Restrain type scale. The app is glanceable, not editorial — there are no
  hero headlines or display sizes.
- Mono digits for timers create clear scannability against dark backgrounds.

---

## Spacing

The system uses Tailwind's default spacing scale. Common values:

| Token   | Value | Use                        |
| ------- | ----- | -------------------------- |
| `p-3`   | 12px  | Card inner padding         |
| `p-4`   | 16px  | Card / form inner padding  |
| `px-3`  | 12px  | Input horizontal padding   |
| `py-2`  | 8px   | Input vertical padding     |
| `gap-3` | 12px  | Component gap within cards |
| `gap-4` | 16px  | Section / layout gap       |
| `space-y-3` | 12px | Vertical list spacing   |
| `space-y-4` | 16px | Vertical section spacing|

---

## Shape & Border

| Token             | Value   | Use                                     |
| ----------------- | ------- | --------------------------------------- |
| `rounded`         | 4px     | Default input, button rounding          |
| `rounded-md`      | 6px     | Tab buttons                             |
| `rounded-lg`      | 8px     | Cards, panels                           |
| `rounded-full`    | 9999px  | Status badges, pills, notification dot  |
| `border`          | 1px     | Card border, input border               |
| `border-l-4`      | 4px     | Category accent strip on task rows      |

Cards use thin `1px` borders (`border-gray-700` on dark, `border-gray-200` on
light) rather than shadows. Drop shadows are avoided — the app is flat by
design.

---

## Elevation

LifeOS is flat. Depth is created through surface alternation (dark card on
darker page background) and thin borders, not drop shadows.

| Level    | Treatment                          | Use                                |
| -------- | ---------------------------------- | ---------------------------------- |
| Page     | `bg-gray-950`, no border           | Base surface                       |
| Card     | `bg-gray-800` + `border-gray-700` | All dashboard cards                |
| Elevated | `border-blue-500/50`              | NowCard active state (blue border)  |
| Toast    | `shadow-lg` + `border-l-4`        | Notification toast (only shadow)   |
| Light    | `bg-white` + `border-gray-200`    | Skills / finance / news surfaces   |

---

## Component Patterns

### Card (dark)

Default container for dashboard content.

```
bg-gray-800 rounded-lg border border-gray-700 p-3|p-4
```

### Card with category accent

Task row in TaskList.

```
border-l-4 border-l-{category-color} bg-gray-800 rounded-lg p-3
```

### Status badge

```
rounded-full text-xs px-2 py-0.5 {bg}/{text}
```

### Primary button

```
bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded transition-colors
```

### Input (dark)

```
w-full bg-gray-700 text-gray-100 rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none
```

### Select (dark)

```
bg-gray-700 text-gray-300 rounded px-3 py-2 border border-gray-600
```

### Pill chip (habits, filters)

```
rounded-full inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors border
```

### Notification toast

```
fixed top-4 right-4 max-w-sm bg-white shadow-lg rounded-lg border-l-4 border-blue-500 p-3 transform transition-transform duration-300
```

### Error banner

```
bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded text-sm
```

### Skeleton loading

```
animate-pulse bg-gray-700 rounded
```

---

## Layout Patterns

### Page shell

```
min-h-screen bg-gray-950 text-gray-100
  max-w-2xl mx-auto px-4 py-8 space-y-6
```

### Section header

```
border-b border-gray-800 pb-4
```

### Two-column card grid

```
grid grid-cols-1 sm:grid-cols-2 gap-4
```

### Inline list row

```
flex items-center justify-between p-3
```

### Nav tabs

```
flex border-b border-gray-800
  active:  bg-blue-600 text-white
  inactive: text-gray-400 hover:text-gray-200
```

---

## Interaction Patterns

| Action            | Behavior                                                     |
| ----------------- | ------------------------------------------------------------ |
| Primary CTA       | `bg-blue-600 hover:bg-blue-500` solid fill                   |
| Text link         | `text-blue-400 hover:text-blue-300` or `hover:underline`     |
| Task row          | Static card (no click) — inline status select                |
| Habit chip        | Toggle on click, `hover:bg-gray-200`                         |
| List item hover   | `hover:bg-gray-50` (light) or `hover:bg-gray-700` (dark)     |
| Form submit       | Full-width primary button at bottom of form                  |
| Delete action     | `text-red-500 hover:text-red-700`                            |
| Loading           | Skeleton placeholders with `animate-pulse`                   |

---

## Responsive Behavior

The app is designed for a permanently docked MacBook external monitor. It does
not need to be mobile-friendly, but should not break at common desktop widths.

| Width           | Behavior                                 |
| --------------- | ---------------------------------------- |
| < 640px         | Single-column cards, stacked nav         |
| 640px+          | Two-column grid for Now/Next cards       |
| 768px+          | Wider layout, comfortable side margins   |

---

## Known Gaps (to resolve as development continues)

1. **Dark/light mode inconsistency**: Dashboard/Routine use the dark palette;
   Skills, Finance, Habits, Workouts, News, and Notifications currently use
   light-mode colors. These should be migrated to the dark theme per the spec
   (`§8 Frontend design principles` — dark theme by default).
2. **No CSS custom properties**: All colors are inline Tailwind classes. Consider
   defining a `tailwind.config.js` or `@theme` block in `index.css` to codify
   design tokens once the palette stabilizes.
3. **No shared component library**: Base UI elements (Button, Card, Input,
   Select, Badge, Modal) are repeated inline across modules. Extract when a
   third module duplicates the same pattern.
4. **No font loading**: Uses system-ui only. If a custom typeface is desired
   later (e.g., a monospace for the dashboard), add via `@fontsource` in
   `index.css`.
