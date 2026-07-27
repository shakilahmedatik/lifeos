# Phase 1: Critical Path

> [!NOTE]
> ✅ **Status: Complete** — All Phase 1 tasks have been fully implemented and verified in the codebase.

> Fix blockers and correctness bugs first. These items affect data integrity, user trust, or developer velocity.

## 1. Fix Timezone Mismatch (Client/Server Date Disagreement)

### Problem
- **Server** computes dates in Asia/Dhaka (UTC+6) via `shared/timezone.ts` (`nowInDhaka()`, `todayInDhaka()`).
- **Client** uses browser-native `new Date().toISOString().slice(0, 10)` (UTC).
- When Dhaka is ahead of UTC (e.g., after 18:00 UTC), the client’s "today" = yesterday in Dhaka. This breaks:
  - Habit log/unlog ("are we logging for today?")
  - Task fetching (`?date=YYYY-MM-DD` on the dashboard)
  - Finance monthly view

### Implementation Plan

#### 1a. Create a shared date-utils package

**New file:** `packages/contracts/src/date-utils.ts`

```ts
/**
 * Returns YYYY-MM-DD based on a target timezone (IANA format).
 * If the user has a configured timezone (from settings), use that.
 * Otherwise, fall back to the browser's local timezone.
 *
 * Why not just use getTimezoneOffset()? Because:
 * 1. getTimezoneOffset() returns the *current* offset, which may differ from
 *    the offset on the target date (DST transitions).
 * 2. The user's device timezone may differ from their intended tracking timezone.
 *    A user in UTC whose tasks are in Asia/Dhaka needs Dhaka dates, not UTC dates.
 */
export function getClientDateString(timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date().toLocaleDateString("sv-SE", { timeZone: tz }); // "sv-SE" gives YYYY-MM-DD
}

export function getClientMonthString(timezone?: string): string {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export function getClientCurrentMinute(): Date {
  // Used for countdown clocks and live updates — returns the *actual* local minute.
  return new Date();
}
```

**Why this approach?**
- Uses `Intl.DateTimeFormat` with an IANA timezone, which handles DST correctly.
- Accepts an optional `timezone` parameter. When Phase 4.3 (Settings) lands, pass `settings.timezone` here. Until then, uses the browser's local timezone (which is correct for most single-timezone users).
- The server never computes "today" — the client always sends an explicit date string.

#### 1b. Make backend accept explicit date strings instead of computing its own

- Every route that filters by date/today already accepts a query param or body field (e.g., `GET /api/routine/tasks?date=YYYY-MM-DD`). Ensure **the frontend always sends the date**; the backend simply uses the inbound string.
- For the dashboard `GET /api/dashboard/summary`, accept `?date=YYYY-MM-DD` (default to server's `todayInDhaka()` for backward compatibility, but prefer client-provided).
- For habit logs: `POST /api/habits/:id/log` currently assumes "today" (server-side). Change to accept an explicit `date` in the body (default to server-today if missing).

#### 1c. Fix Dashboard countdown clock

- `DashboardPage.tsx` countdown uses `new Date()` (client local). This is actually correct **for a wall-clock countdown** because the user wants the timer to tick in their own time.
- Add a comment clarifying intent:
  - Server date = "what day to show tasks for"
  - Client clock = "when is this task's end time, ticking live"
- The fix is in **1b and 1d** below (ensuring dates match), not in the timer itself.

#### 1d. Fix `handleHabitToggle` in DashboardPage

**File:** `frontend/src/pages/DashboardPage.tsx:51`

Currently:
```ts
await api.logHabit(habitId, new Date().toISOString().slice(0, 10));
```

Replace with:
```ts
import { getClientDateString } from "../../../packages/contracts/src/date-utils.js";
const today = getClientDateString();
await api.logHabit(habitId, today); // Calls PATCH /api/habits/:id/log with { date: today }
```

**Backend change:** Update `logHabit` in `habit-log-service.ts` to accept and use a `date` field (rather than computing `todayInDhaka()` internally).

### Verification
1. Manually test on a machine set to a timezone ahead of Dhaka (e.g., UTC+9).
2. Verify that logging a habit from the dashboard records it for the correct date.
3. Verify `GET /api/dashboard/summary` returns tasks for the client's "today" when `?date=` is passed.
4. Add unit test: `getClientDateString("Asia/Dhaka")` returns the expected date regardless of the host timezone. This is the CI-safe version — explicitly passing a timezone makes the test deterministic.
5. **CI note:** `Intl.DateTimeFormat` is environment-dependent. Always pass an explicit `timezone` argument in unit tests. The server-side default `todayInDhaka()` remains as the backward-compatible fallback.
6. **Future (Phase 4.3):** Once settings stores a timezone, verify `getClientDateString("America/New_York")` returns the correct date for that timezone even when the browser is set to UTC.

---

## 2. Fix Inverted `reminderSound` Logic + Null-As-Number Bug

### Problem
In `frontend/src/pages/NotificationsPage.tsx:26-40`:

```ts
const r: Reminder[] = [];
for (const t of data) {
  if (t.reminderMinutesBefore) {
    r.push({
      taskId: t.id,
      minutesBefore: t.reminderMinutesBefore,
      sound: t.reminderSound ? "default" : "none",  // <-- INVERTED
    });
  }
}
```

- `reminderSound: true` means "silent" (backend semantics), but the UI shows `"default"`.
- This causes the toggle to show the wrong sound while the actual behavior may be correct/incorrect in unexpected ways.

Additionally, `handleRemoveReminder` sends `null as unknown as number` (line 68) because the type says `number | undefined` rather than `number | null`.

### Implementation Plan

#### 2a. Align backend type with intent

**File:** `packages/contracts/src/index.ts` (and backend `routine/domain/types.ts`)

Change:
```ts
reminderMinutesBefore?: number;
reminderSound?: boolean; // true = silent
```

Consider renaming for clarity:
```ts
reminderMinutesBefore?: number | null;
reminderSilent?: boolean; // true = no sound
```

Or keep the existing name but document it. If renaming, update both backend and frontend in one PR.

#### 2b. Fix the frontend mapping

```ts
sound: t.reminderSound ? "none" : "default",  // silent? -> none; else -> default
```

#### 2c. Fix `handleRemoveReminder` to send null instead of cast

```ts
const handleRemoveReminder = async (taskId: string) => {
  try {
    await api.updateTask(taskId, { reminderMinutesBefore: null });
    fetchTasks();
  } catch { /* ... */ }
};
```

**Backend:** Ensure `TransactionService` / `updateTask` route accepts `null` for `reminderMinutesBefore`. Currently the route does `Number(patch.reminderMinutesBefore)` which would turn `null` into `0`. Use explicit null handling:

```ts
const updates: Partial<Task> = {};
if (patch.title !== undefined) updates.title = patch.title;
if (patch.reminderMinutesBefore !== undefined) {
  updates.reminderMinutesBefore = patch.reminderMinutesBefore ?? null;
}
```

#### 2d. Add validation for reminder values

- `minutesBefore` should be `5 | 10 | 15 | 30 | 60`
- Add Zod schema or at least a runtime guard in the backend router:
  ```ts
  if (input.minutesBefore !== undefined && ![5,10,15,30,60].includes(input.minutesBefore)) {
    return res.status(400).json({ error: "Invalid minutesBefore" });
  }
  ```

### Verification
1. Set reminder with sound = "default" → click backend DB, verify `reminderSound = false`.
2. Set reminder with sound = "none" → verify `reminderSound = true`.
3. Remove reminder → verify column becomes `null` (not `0`).

---

## 3. Align Contracts Types with Backend Domain Types

### Problem
`Task`, `TaskCategory`, `TaskStatus`, `NewTaskInput` are defined **twice**:
- `packages/contracts/src/index.ts`
- `backend/src/modules/routine/domain/types.ts`

They must remain manually in sync. If they drift, the frontend and backend will disagree on:
- Allowed category strings
- Lat/lng of task fields
- `NewTaskInput` optional/required fields

### Implementation Plan

#### 3a. Choose contracts as the single source of truth

- Move `interface Task`, `interface NewTaskInput`, `type TaskCategory`, `type TaskStatus` from `backend/src/modules/routine/domain/types.ts` to `packages/contracts/src/index.ts`.
- Keep `domain/types.ts` as a **re-export**:
  ```ts
  // backend/src/modules/routine/domain/types.ts
  export type { Task, NewTaskInput, TaskCategory, TaskStatus } from "@lifeos/contracts";
  ```

#### 3b. Fix backend imports

Update all backend files that import from `./domain/types` to instead import from `@lifeos/contracts`.

**Files to update:**
- `backend/src/modules/routine/domain/rules.ts`
- `backend/src/modules/routine/ports/task-repository.ts`
- `backend/src/modules/routine/adapters/sqlite/sqlite-task-repository.ts`
- `backend/src/modules/routine/application/use-cases.ts`
- `backend/src/modules/routine/api/router.ts`
- `backend/src/modules/dashboard/ports/dashboard-dependencies.ts`
- `backend/src/modules/dashboard/application/summary.ts`
- `backend/src/modules/dashboard/api/router.ts`

#### 3c. Update `packages/contracts` package.json for workspace consumption

```json
{
  "name": "@lifeos/contracts",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Trade-off decision:**  
This plan introduces a build step for contracts. Alternative: keep contracts as pure `.ts` and rely on Vite/tsx resolution. But adding `"exports"` with `.d.ts` is the canonical approach and prevents runtime JS import failures.

#### 3d. Apply the same pattern to News and Notification types

- Move `RssFeed`, `NewsArticle` from `backend/src/modules/news/domain/types.ts` and `frontend/src/modules/news/api.ts` into contracts.
- Move `Notification`, `NotificationSoundType`, `NotificationStatus` from `backend/src/modules/notifications/domain/types.ts` into contracts.
- Update frontend `reminders` local interface in `NotificationsPage.tsx` to use `Notification` from contracts.

### Verification
1. `pnpm run build` succeeds for contracts.
2. `tsc --noEmit` in `backend/` and `frontend/` passes.
3. Runtime: create a task with all fields; ensure no serialization gaps.

---

## 4. Add Error Boundary to React App

### Problem
`frontend/src/App.tsx` has no `<ErrorBoundary>`. An unhandled error (e.g., `fetch` with bad URL, `undefined.map()` in a new component) will unmount the entire React tree. The user sees a blank screen with no recovery path.

### Implementation Plan

#### 4a. Create `ErrorBoundary.tsx`

**New file:** `frontend/src/components/ErrorBoundary.tsx`

```tsx
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
          <div className="max-w-md w-full p-6 space-y-4">
            <h1 className="text-xl font-bold text-red-400">Something went wrong</h1>
            <p className="text-sm text-gray-400">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 4b. Wrap routes in `App.tsx`

```tsx
import ErrorBoundary from "./components/ErrorBoundary.js";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          {/* ... existing routes */}
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
```

### Verification
1. Temporarily throw an error in a component's body. Re-render. Confirm the boundary renders the fallback.
2. Click "Try again" — should restore to a valid UI state (possibly the page that crashed).

---

## 5. Replace Silent `catch {}` with Visible Error States

### Problem
Every page uses `catch { /* silently fail */ }` or `catch { setError(...) }` inconsistently. Users get no feedback when operations fail (network dropped, backend down, validation error). Result: user clicks "Add Habit", nothing happens, they click again, a duplicate is created.

### Implementation Plan

#### 5a. Define a shared toast primitive

**New file:** `frontend/src/components/ui/Toast.tsx`

```tsx
import { useState, useCallback } from "react";

type ToastType = "error" | "success" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastId = 0;
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const error = useCallback(
    (message: string) => show(message, "error"),
    [show],
  );
  const success = useCallback(
    (message: string) => show(message, "success"),
    [show],
  );

  return { toasts, error, success, show };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl text-sm shadow-2xl animate-slide-up ${
            t.type === "error"
              ? "bg-red-900/80 border border-red-700/50 text-red-200"
              : t.type === "success"
                ? "bg-emerald-900/80 border border-emerald-700/50 text-emerald-200"
                : "bg-gray-800/80 border border-gray-700/50 text-gray-200"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

#### 5b. Lift toast state to `Layout` so every page can use it

**File:** `frontend/src/components/layout/Layout.tsx`

```tsx
import { useToast, ToastContainer } from "../ui/Toast.js";

export default function Layout() {
  const { toasts, error } = useToast(); // expose to children via context or prop drilling

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-gray-100">
      <Outlet />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
```

**Decision point:** For a small app, prop-drilling via a simple context is fine. If the team prefers, use Zustand (Phase 1 could reference it, but keep Phase 1 minimal).

Use a basic context in `frontend/src/lib/toast-context.tsx`:

```tsx
import { createContext, useContext } from "react";
import { useToast } from "../components/ui/Toast.js";

const ToastContext = createContext<ReturnType<typeof useToast> | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const toast = useToast();
  return (
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  );
};

export const useAppToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAppToast must be used within ToastProvider");
  return ctx;
};
```

Then wrap `<Routes>` in `App.tsx` with `<ToastProvider>`.

#### 5c. Migrate every `catch {}` in pages

**RoutinePage.tsx**
```ts
const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  // ...
  try {
    await api.createTask(input);
    // ...
    toast.success("Task created");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to create task");
    toast.error("Failed to create task");
  }
};
```

**HabitsPage.tsx, FinancePage.tsx, NotificationsPage.tsx, SkillsPage.tsx** — same pattern.

For `DashboardPage.handleHabitToggle`:
```ts
} catch (err) {
  toast.error("Failed to update habit");
}
```

#### 5d. Add global `fetch` interceptor (optional, but recommended)

In `frontend/src/lib/api.ts`, surface non-2xx messages:

```ts
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

Pages can then show `catch`-derived messages via `toast.error(err.message)`.

### Verification
1. Disconnect network. Click "Create Task" in Routine. Confirm red toast appears.
2. Reconnect. Click "Create Task" again. Confirm task appears AND success toast fires.
3. Verify no silent failures in `>` DevTools console.

---

## 6. Add Health Check Endpoint

### Problem
When the backend fails (DB corrupt, port conflict, migration crash), the frontend shows enigmatic `NetworkError` or hangs indefinitely. There is no way to distinguish "backend is down" from "backend is slow." Developers and CI need a simple liveness probe.

### Implementation Plan

#### 6a. Create health endpoint

**New file:** `backend/src/modules/health/api/router.ts`

```ts
import { Router } from "express";

export function createHealthRouter(db: { readonly: boolean; open: boolean }) {
  const router = Router();

  router.get("/", (_req, res) => {
    const dbOk = db.open && !db.readonly;
    const status = dbOk ? "ok" : "degraded";
    const code = dbOk ? 200 : 503;
    res.status(code).json({
      status,
      timestamp: new Date().toISOString(),
      db: { open: db.open, readonly: db.readonly },
      uptime: process.uptime(),
    });
  });

  return router;
}
```

#### 6b. Mount in `backend/src/index.ts`

```ts
import { createHealthRouter } from "./modules/health/api/router.js";

app.use("/api/health", createHealthRouter(db));
```

#### 6c. Verify DB connectivity inside the call

The endpoint should actually execute `db.prepare("SELECT 1").get()` to confirm the DB is responsive, not just report cached state:

```ts
try {
  db.prepare("SELECT 1 AS alive").get();
  // ...
} catch {
  res.status(503).json({ status: "error", db: "unreachable" });
}
```

### Dependencies
- None. This is independent of all other phases.

### Verification
1. `curl http://localhost:3000/api/health` returns `{"status":"ok",...}`.
2. Stop the backend. Confirm the frontend's global `fetch` interceptor (Phase 1.5d) shows a meaningful error message.
3. CI job (Phase 5.3) can curl this endpoint before running tests to confirm the test server is alive.

---

## 7. Add Basic Authentication Gate (Security Baseline)

### Problem
The app has no authentication. If the backend port is exposed (LAN, shared machine, or port forwarding), anyone can read/write all data. For a personal productivity tool, this is a data privacy risk. This does not belong in Phase 4 — it is a security gate that belongs with the other Critical Path fixes.

### Implementation Plan

#### 7a. Add a simple password gate (not full OAuth)

Since this is a single-user local app, full auth (OAuth, JWT sessions) is overkill. A simple shared password gate is sufficient.

**New file:** `backend/src/shared/auth-middleware.ts`

```ts
import type { Request, Response, NextFunction } from "express";

const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!AUTH_PASSWORD) return next(); // No password set — open access

  const token = req.headers["x-auth-token"] || req.query.token;
  if (token === AUTH_PASSWORD) return next();

  res.status(401).json({ error: "Unauthorized" });
}
```

**File:** `.env`

```bash
# Optional: set a password to gate access. Leave empty for open access.
AUTH_PASSWORD=
```

#### 7b. Apply to all API routes

```ts
// backend/src/index.ts
import { authMiddleware } from "./shared/auth-middleware.js";

app.use("/api", authMiddleware);
```

#### 7c. Frontend: store token in memory, send with every request

```ts
// frontend/src/lib/api.ts
let authToken: string | null = null;

export function setAuthToken(token: string) { authToken = token; }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = { ...options?.headers };
  if (authToken) headers["x-auth-token"] = authToken;
  // ... existing fetch logic
}
```

**Frontend login screen:** If `GET /api/settings` returns 401, show a simple password input screen.

### Verification
1. Leave `AUTH_PASSWORD` empty. App works as before (open access).
2. Set `AUTH_PASSWORD=secret`. Reload. Verify API calls return 401.
3. Enter password in frontend. Verify access is restored.
4. Verify password is not logged or stored in localStorage.
