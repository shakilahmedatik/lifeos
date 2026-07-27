# Phase 2: Stability

> After fixing correctness, complete the design system, add input validation, reduce resource leaks, and shore up tests.

## 1. Complete Dark-Theme Migration

### Problem
Design spec (`docs/DESIGN.md`) mandates a dark-only palette with these design tokens:

| Token | Value | Current usage |
|--------|-------|----------------|
| `--color-surface` | `#030712` | Correctly used on body |
| `--color-card` | `#1e293b` | Used in some components |
| `--color-input` | `#334155` | Used sparingly |
| `--color-accent` | `#3b82f6` | Correct |
| `--color-success` | `#22c55e` | Correct |
| `--color-danger` | `#ef4444` | Correct |
| `--color-warning` | `#eab308` | Correct |

But many components hardcode Tailwind colors (`bg-gray-700/50`, `bg-gray-800/60`, `bg-gray-900/30`) instead of the custom tokens or CSS variables. Skills, Finance, Habits, Workouts, News, and Notifications pages use lighter gray mixes (e.g., `bg-gray-800/60` for dark backgrounds, but the surrounding context in some cards is bg-white or bg-gray-100).

### Implementation Plan

#### 1a. Expand `index.css` theme tokens

**File:** `frontend/src/index.css`

Replace the current `@theme` block:

```css
@theme {
  --color-surface: #030712;
  --color-card: #1e293b;
  --color-card-hover: #334155;
  --color-input: #334155;
  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #eab308;

  // Text colors
  --color-text-primary: #f3f4f6;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #6b7280;

  // Borders
  --color-border: #374151;
  --color-border-subtle: #1f2937;
}
```

Map these in `tailwind.config.ts` or use inline `style={{ color: "var(--color-text-primary)" }}` until Tailwind v4 CSS-based tokens are fully stabilized.

#### 1b. Define design-system utility classes (or Tailwind theme extension)

Because Tailwind v4 uses CSS-based configuration, we cannot add `text-text-primary` unless we set up a proper `@theme` map. The simplest path is **CSS custom property utility classes**:

```css
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-muted { color: var(--color-text-muted); }

.bg-surface { background-color: var(--color-surface); }
.bg-card { background-color: var(--color-card); }
.bg-input { background-color: var(--color-input); }

.border-default { border-color: var(--color-border); }
.border-subtle { border-color: var(--color-border-subtle); }
```

#### 1c. Audit and replace per-page tokens

Work through each page module:

| File | Replace | With |
|------|---------|------|
| `pages/SkillsPage.tsx` | `bg-gray-800/60` | `bg-card` |
| `modules/skills/*` | verify any `text-gray-100` becomes `text-primary` | |
| `pages/FinancePage.tsx` | `bg-gray-700/50` (inputs) | `bg-input` |
| `pages/HabitsPage.tsx` | `bg-gray-800/60` (cards) | `bg-card` |
| `modules/habits/*` | button backgrounds | `bg-card` + `hover:bg-card-hover` |
| `pages/WorkoutsPage.tsx` | same | same |
| `pages/NewsPage.tsx` | `bg-gray-800/60` | `bg-card` |
| `pages/NotificationsPage.tsx` | Same pattern | Same replacement |

Use grep to find remaining hardcodes:
```bash
rg 'gray-7|gray-8|gray-9' frontend/src
```

#### 1d. Update shared components

`Card.tsx`: Replace `bg-gray-800/60` with `bg-card`, `border-gray-700/50` with `border-default`.

`Button.tsx`: Use `--color-accent` for primary variant.

### Verification
1. Run the app and visually inspect each page. No raw `gray-700`/`gray-800`/`gray-900` class strings should appear in the DOM on any page.
2. Run `rg 'gray-7|gray-8|gray-9' frontend/src` — should only match `Badge` variants and the Tooltip background (which can stay).

#### 1e. Accessibility (a11y) Audit During Theme Migration

Since you're touching every component for the theme migration, this is the cheapest time to fix a11y issues.

**Checklist:**
- **Contrast ratios:** All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text). Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) against `--color-surface` (#030712).
- **Focus states:** Every interactive element (inputs, buttons, links) has a visible focus ring. Tailwind's `focus:ring-2 focus:ring-accent` works.
- **Keyboard navigation:** Tab through every page. All buttons, links, and form controls must be reachable and operable via keyboard alone.
- **Semantic HTML:** Use `<nav>`, `<main>`, `<header>`, `<button>` (not `<div onClick>`). Verify no `div` with `onClick` is missing `role="button"` and `tabIndex={0}`.
- **Alt text:** Any images (e.g., workout illustrations, if added later) need `alt` attributes.
- **Screen reader test:** Run VoiceOver (macOS: Cmd+F5) and navigate the Dashboard. Verify card headings, task counts, and habit toggles are announced correctly.

**Files to audit:**
| Component | a11y concern |
|-----------|-------------|
| `Sidebar.tsx` | Use `<nav>` with `aria-label="Main navigation"` |
| `NotificationBell.tsx` | Add `aria-label="Notifications"` and `aria-live="polite"` for count badge |
| `Modal.tsx` | Trap focus inside modal, return focus on close, add `aria-modal="true"` |
| `Toast.tsx` | Add `role="alert"` and `aria-live="assertive"` for error toasts |
| All form `Input`/`Select` | Ensure `<label>` is associated via `htmlFor`/`id` |

#### 1f. Automated Accessibility Testing (a11y)

Manual checks (1e) are essential but regression-prone. Add automated a11y tests to catch violations in CI before they ship.

**New dev dependency:** `pnpm add -D @axe-core/react jest-axe`

**New test file:** `frontend/src/components/__tests__/a11y.test.tsx`

```tsx
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { ToastProvider } from "../../lib/toast-context.js";
import { BrowserRouter } from "react-router-dom";

expect.extend(toHaveNoViolations());

const renderWithA11y = (ui: React.ReactElement) =>
  render(
    <ToastProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ToastProvider>,
  );

describe("Accessibility smoke tests", () => {
  it("DashboardPage has no a11y violations", async () => {
    const { container } = renderWithA11y(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("RoutinePage form inputs have associated labels", async () => {
    const { container } = renderWithA11y(<RoutinePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**CI integration:** Add to the Phase 5.3 CI workflow after frontend unit tests.

**Diagnostic tools for manual audits:**
- `@axe-core/react` runtime warnings in dev mode:
  ```tsx
  // frontend/src/main.tsx
  import { axe } from "@axe-core/react";
  if (import.meta.env.DEV) axe(React);
  ```
- Lighthouse CI in Phase 5.3 for automated scoring.

**Target metrics:**
- WCAG 2.1 AA: 0 critical violations (contrast, missing labels, empty buttons)
- Lighthouse a11y score: >90

---

## 2. Extract `Input` and `Select` Shared Components

### Problem
Every page repeats this class string 6–10 times:
```
bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50
```

That represents ~80 lines of inline JSX clutter and a maintenance trap: change the design system once, fix 50 places.

### Implementation Plan

#### 2a. Create `Input` component

**New file:** `frontend/src/components/ui/Input.tsx`

```tsx
import { useId, type ReactNode, type InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            "w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-primary",
            "placeholder:text-muted",
            "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            leftIcon ? "pl-9" : "",
            error ? "border-danger" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
}
```

#### 2b. Create `Select` component

**New file:** `frontend/src/components/ui/Select.tsx`

```tsx
import type { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

export function Select({ label, error, helperText, options, className = "", id, ...props }: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={[
          "w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-primary",
          "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-danger" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
    </div>
  );
}
```

#### 2c. Migrate all pages

Search for every input/select class string across pages. Examples:

**Before (RoutinePage.tsx):**
```tsx
<input
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="What do you need to do?"
  className="w-full bg-gray-700/50 border border-gray-600/50 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 placeholder-gray-500"
  required
/>
```

**After:**
```tsx
<Input
  label="Task"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="What do you need to do?"
  required
/>
```

Apply to: `RoutinePage`, `HabitsPage`, `SkillsPage`, `FinancePage`, `NotificationsPage`, and any future forms.

#### 2d. Re-export from `components/ui/index.ts`

If one exists, add `export { Input } from "./Input.js";` (and `Select`).

### Verification
1. Storybook is not set up, so manual check: open each form and confirm:
   - Focus border turns `--color-accent`
   - Error borders render red when `error` prop is passed
   - Select dropdown opens with proper contrast
2. Type-check that `Input` and `Select` accept standard HTML attributes (e.g., `disabled`, `maxLength`, `step`).

---

## 3. Add Input Validation (Zod)

### Problem
`zod` is a backend dependency but nothing uses it. Express parses raw JSON with no schema validation. Forms use bare `required` attributes. Bad data silently crashes services or writes corrupt rows.

### Implementation Plan

#### 3a. Define Zod schemas in contracts

**File:** `packages/contracts/src/schemas.ts`

```ts
import { z } from "zod";

export const NewTaskInputSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(["work", "workout", "learning", "habit", "personal", "general"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type NewTaskInput = z.infer<typeof NewTaskInputSchema>;

export const NewHabitInputSchema = z.object({
  name: z.string().min(1).max(255),
  frequency: z.enum(["daily", "weekly"]),
  category: z.enum(["health", "learning", "productivity", "mindfulness", "fitness", "general"]),
});

export const NewTransactionInputSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountMinor: z.number().int().positive(), // minor units (cents)
  note: z.string().max(500).optional().nullable(),
});

export const NewLearningSessionInputSchema = z.object({
  skillCategoryId: z.string().uuid(),
  duration: z.number().int().positive().max(1440), // 24h max
  notes: z.string().max(1000).optional().nullable(),
});

export const NewLearningResourceInputSchema = z.object({
  skillCategoryId: z.string().uuid(),
  title: z.string().min(1).max(255),
  url: z.string().url().optional().nullable(),
  totalLessons: z.number().int().nonnegative().optional(),
});

export const NewWorkoutInputSchema = z.object({
  name: z.string().min(1).max(255),
  exercises: z.array(z.object({
    exerciseId: z.string().uuid(),
    order: z.number().int().nonnegative(),
    sets: z.number().int().positive().optional(),
    reps: z.string().optional(),
    restSeconds: z.number().int().nonnegative().optional(),
  })),
});

export const UpdateReminderSchema = z.object({
  reminderMinutesBefore: z.number().int().positive().optional().nullable(),
  reminderSound: z.boolean().optional(),
});
```

#### 3b. Add Zod validation middleware to Express

**New file:** `backend/src/shared/validation.ts`

```ts
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", issues: err.issues });
      }
      next(err);
    }
  };
}
```

#### 3c. Apply to routers

```ts
// backend/src/modules/routine/api/router.ts
import { validateBody } from "../../../shared/validation.js";
import { NewTaskInputSchema } from "@lifeos/contracts";

router.post("/", validateBody(NewTaskInputSchema), (req, res) => {
  const input = req.body; // now fully typed and validated
  const task = createTask(taskRepo, input);
  res.status(201).json({ task, overlapsWith: [] });
});
```

Apply similarly to: Habits, Workouts, Finance, Skills, Notifications routes.

#### 3d. Use on the frontend for pre-submit validation

Option A: Pass Zod errors to `Input`'s `error` prop.

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = NewTaskInputSchema.safeParse({ title, category, date, startTime, endTime, notes });
  if (!result.success) {
    setError(result.error.issues[0].message);
    toast.error(result.error.issues[0].message);
    return;
  }
  // proceed with API call
};
```

Option B (recommended for Phase 2+): Use React Hook Form + Zod resolver. For now, keep manual validation to minimize dependency churn.

### Verification
1. Send `POST /api/routine/tasks` with empty body. Expect 400 with zod error list.
2. Send `POST /api/routine/tasks` with `amountMinor: -5` (for finance). Expect 400.
3. Frontend: submit a habit with a 300-character name. Zod `max(255)` catches it server-side; client shows toast with the issue.

---

## 4. Fix SSE Connection Leak

### Problem
`frontend/src/modules/notifications/useNotificationSSE.ts` creates an `EventSource` but:

- `NotificationBell` is mounted **permanently** in the dock (Sidebar). It calls `useNotificationSSE()` on every render cycle that includes the bell.
- The SSE connection lives as long as `NotificationBell` is mounted (i.e., the entire app session). If it throws or the tab is hidden, the connection dies and is **never re-established**.
- Meanwhile, `NotificationsPage` does **not** subscribe to the stream — there’s no live notification feed on the page that manages them.

### Implementation Plan

#### 4a. Decide the canonical stream owner

There are two options; pick one:

- **Option A (recommended):** SSE lives in `NotificationsPage` alone. NotificationBell becomes a passive poller (e.g., `setInterval` every 60s hitting `GET /api/notifications/pending`) + unread badge counter.
- **Option B:** SSE lives in `Layout` and broadcasts to children via context. NotificationBell consumes via hook.

**Recommend Option A** because:
- Only the notifications page needs real-time streaming.
- The bell is metadata (unread count), which is cheap to poll.
- Reduces socket count from 1 per bell to 1 per page.

#### 4b. Move SSE connection to `NotificationsPage`

```tsx
// frontend/src/pages/NotificationsPage.tsx
import { useNotificationSSE } from "../modules/notifications/useNotificationSSE.js";

export default function NotificationsPage() {
  // ... existing state
  const { lastNotification, isConnected } = useNotificationSSE({
    autoPlaySound: true,
    onNotification: (n) => {
      setNotifications((prev) => [n, ...prev]);
      toast.success(`Reminder: ${n.taskTitle}`);
    },
  });

  // Remove the polling fetchTasks interval. Use SSE to drive new items.
}
```

#### 4c. Replace NotificationBell/Ellipsis with a lightweight poller

**New hook:** `frontend/src/modules/notifications/useUnreadCount.ts`

```tsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const reminders = await api.getPendingNotifications(); // new endpoint
        if (!cancelled) setCount(reminders.length);
      } catch { /* swallow */ }
    };
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return count;
}
```

Use in `NotificationBell`:
```tsx
const unreadCount = useUnreadCount();
```

#### 4d. Backend: add `GET /api/notifications/pending`

```ts
// backend/src/modules/notifications/api/router.ts
router.get("/pending", authMiddleware, (req, res) => {
  const pending = notificationService.getPendingNotifications();
  res.json(pending);
});
```

(If auth middleware is not yet added, skip for Phase 1; local-only app is acceptable for now.)

### Verification
1. Open DevTools → Network → WS/ES. When on Dashboard, there should be **zero** SSE connections.
2. When on Notifications page, see one SSE connection to `/api/notifications/stream`.
3. Navigate away from Notifications. Confirm the connection closes (`eventSource.readyState === 2`).
4. Re-navigate to Notifications. Confirm a new connection opens.

---

## 5. Add Frontend Tests for All Pages

### Problem
Frontend test coverage is 4 files — all workout-related. There are zero tests for Dashboard, Routine, Habits, Finance, Skills, News, and Notifications. A bug in any of those pages hits production undetected.

### Implementation Plan

#### 5a. Set up Vitest Testing Library already

Already configured (`vitest.config.ts`, `@testing-library/react`, `jsdom`). Just needs consistent usage.

#### 5b. Add a shared `renderWithProviders` helper

**New file:** `frontend/src/testing/render.tsx`

```tsx
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../lib/toast-context.js"; // from Phase 1

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </ToastProvider>,
  );
}
```

#### 5c. Write tests for each page (one per page minimum)

**Test:** `frontend/src/pages/__tests__/DashboardPage.test.tsx`

```tsx
import { renderWithProviders, screen } from "../../testing/render.js";
import DashboardPage from "../DashboardPage.js";

// Mock API calls
vi.mock("../../lib/api.js", () => ({
  api: {
    getSummary: vi.fn().mockResolvedValue({
      now: { id: "1", title: "Task 1", startTime: "09:00", endTime: "10:00", category: "work", date: "2025-01-01" },
      next: null,
      todayCount: 3,
      todayDoneCount: 1,
      dueHabits: [],
    }),
  },
}));

describe("DashboardPage", () => {
  it("renders Now and Next cards with summary data", async () => {
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Task 1")).toBeVisible();
    expect(screen.getByText("1/3 tasks")).toBeVisible();
  });

  it("shows loading skeleton initially", () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeVisible();
  });
});
```

**Repeat for:**

| File | Test focus |
|------|-----------|
| `pages/RoutinePage.test.tsx` | Render task list, submit form, delete task |
| `pages/HabitsPage.test.tsx` | Render habit list, toggle habit log |
| `pages/FinancePage.test.tsx` | Render accounts/transactions, submit new transaction |
| `pages/SkillsPage.test.tsx` | Render each tab (sessions/courses/categories), submit forms |
| `pages/NotificationsPage.test.tsx` | Render reminder list, set reminder |
| `pages/NewsPage.test.tsx` | Render feed list, render article list |

#### 5d. Add edge-case tests (critical for correctness)

Rendering tests verify the UI renders. Edge-case tests verify the app handles bad data and race conditions.

**New test file:** `frontend/src/pages/__tests__/RoutinePage.edge-cases.test.tsx`

```tsx
describe("RoutinePage edge cases", () => {
  it("handles API returning 500 gracefully", async () => {
    vi.mocked(api.getTasks).mockRejectedValue(new Error("Internal Server Error"));
    renderWithProviders(<RoutinePage />);
    expect(await screen.findByText(/failed to load/i)).toBeVisible();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("prevents duplicate task submission while loading", async () => {
    vi.mocked(api.createTask).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
    renderWithProviders(<RoutinePage />);
    // Fill form, click submit twice rapidly
    // Verify api.createTask called only once
  });

  it("handles empty task list", async () => {
    vi.mocked(api.getTasks).mockResolvedValue([]);
    renderWithProviders(<RoutinePage />);
    expect(await screen.findByText(/no tasks/i)).toBeVisible();
  });
});
```

**New test file:** `frontend/src/pages/__tests__/HabitsPage.edge-cases.test.tsx`

```tsx
describe("HabitsPage edge cases", () => {
  it("handles double-click on habit toggle (idempotency)", async () => {
    // User clicks toggle twice rapidly — should only log once
    renderWithProviders(<HabitsPage />);
    const toggle = await screen.findByRole("button", { name: /log/i });
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    await waitFor(() => {
      expect(api.logHabit).toHaveBeenCalledTimes(1);
    });
  });

  it("renders habits with special characters in name", async () => {
    vi.mocked(api.getHabits).mockResolvedValue([
      { id: "1", name: "Meditate 10min <daily>", frequency: "daily", category: "mindfulness" },
    ]);
    renderWithProviders(<HabitsPage />);
    expect(await screen.findByText("Meditate 10min <daily>")).toBeVisible();
  });
});
```

**New test file:** `frontend/src/pages/__tests__/FinancePage.edge-cases.test.tsx`

```tsx
describe("FinancePage edge cases", () => {
  it("handles overlapping task times in summary", async () => {
    // Two transactions with the same timestamp — should not crash
    renderWithProviders(<FinancePage />);
    // Verify page renders without error
  });

  it("formats negative amounts correctly", async () => {
    // Expense of -500 minor units should display as ৳5.00, not -৳5.00
  });

  it("handles category lookup miss (orphaned transaction)", async () => {
    // Transaction has categoryId that doesn't match any category
    // Should not crash, should show "Unknown" or similar
  });
});
```

**New test file:** `frontend/src/pages/__tests__/NotificationsPage.edge-cases.test.tsx`

```tsx
describe("NotificationsPage edge cases", () => {
  it("handles reminderMinutesBefore of 0 (should be rejected or treated as null)", async () => {
    // 0 is not in [5,10,15,30,60] — verify validation catches it
  });

  it("handles SSE disconnection gracefully", async () => {
    // Mock EventSource to fire onerror immediately
    // Verify page shows "disconnected" state, not a crash
  });
});
```

#### 5e. Wire tests into script

**File:** `package.json` (root)

Add:
```json
{
  "scripts": {
    "test": "pnpm -r test",
    "test:watch": "pnpm -r test --watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

Run `vitest --coverage` and ensure **frontend** coverage climbs to >60%.

### Verification
1. `pnpm test` passes all new tests.
2. `pnpm test:coverage` shows frontend coverage >50%.
3. Intentionally break an `expect` in one test, confirm it fails.

---

## 6. Add API Rate Limiting Middleware

### Problem
API endpoints have no rate limiting or abuse protection. A broken loop in the client or aggressive external requests could cause high CPU load or SQLite database contention.

### Implementation Plan
- Install `express-rate-limit` in `backend/package.json`.
- Create rate limiter middleware in `backend/src/shared/rate-limiter.ts`:
  - Global API rate limiter (e.g., 300 requests / 15 mins).
  - Stricter rate limiter for auth / sensitive actions (e.g., 20 attempts / 15 mins).
- Attach global limiter to `/api` routes in `backend/src/index.ts`.

### Verification
1. Sending repeated rapid requests to `/api/health` triggers `429 Too Many Requests` after threshold.
2. Headers `RateLimit-Limit`, `RateLimit-Remaining` are returned in response.

---

## 7. Add Mobile Responsiveness & Touch UI Guidelines

### Problem
The frontend layout relies on a fixed desktop sidebar without mobile navigation or touch-optimized UI controls.

### Implementation Plan
- Update `Sidebar.tsx` to support a collapsible mobile drawer menu with hamburger toggle on small viewports (`< md`).
- Ensure touch targets across buttons, habit check items, and navigation links meet min 44x44px target sizes.
- Add responsive layout classes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) across `DashboardPage`, `FinancePage`, `HabitsPage`, and `WorkoutsPage`.

### Verification
1. Resize window to 375px (iPhone viewport size) and verify mobile drawer menu functions cleanly.
2. Run axe accessibility smoke tests to ensure mobile navigation elements are screen-reader accessible.
