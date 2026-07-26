# Phase 4: Features

> Core experience is solid and fast. Now deliver the features the spec requires and the user actually wants day-to-day.

## 1. Wire Up Workout Detail Views and Active Session Timer

### Problem
- `frontend/src/modules/workouts/WorkoutDetail.tsx`, `CoachMode.tsx`, `WorkoutHistory.tsx`, `WorkoutSessionDetail.tsx` all exist but are **never imported**.
- `useWorkoutTimerSSE.ts` exists but is unused.
- The backend `NotificationBroadcaster.broadcastWorkoutTimerAlert` is implemented but never called.

### Implementation Plan

#### 1a. Add a workout detail sub-page

**New file:** `frontend/src/pages/WorkoutDetailPage.tsx`  

Or inline it within `WorkoutsPage.tsx` as a conditional render.

```tsx
import { useParams } from "react-router-dom";
import { useWorkouts } from "../modules/workouts/useWorkouts.js";
import { CoachMode } from "../modules/workouts/CoachMode.js";
import { WorkoutProgress } from "../modules/workouts/WorkoutProgress.js";

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { workoutWithExercises, isLoading } = useWorkouts();
  // Or call API directly: api.getWorkoutWithExercises(id!)

  if (isLoading || !workoutWithExercises) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={() => history.back()}>Back</Button>
        <h1 className="text-2xl font-bold text-primary">{workoutWithExercises.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
          <Button size="sm" onClick={() => setCoachMode(true)}>Start Workout</Button>
        </CardHeader>
        {/* Render exercise list with sets/reps */}
        {workoutWithExercises.exercises.map((ex) => (
          <div key={ex.exerciseId} className="py-2 border-b border-border last:border-0">
            <span className="text-sm font-medium text-primary">{ex.exercise.name}</span>
            <span className="text-xs text-muted ml-2">{ex.sets} sets × {ex.reps} reps · {ex.restSeconds}s rest</span>
          </div>
        ))}
      </Card>

      {coachMode && <CoachMode workout={workoutWithExercises} onComplete={() => setCoachMode(false)} />}
    </div>
  );
}
```

#### 1b. Wire `CoachMode` to consume SSE

**File:** `frontend/src/modules/workouts/CoachMode.tsx`

In `CoachMode`, subscribe to SSE alerts for the ongoing session:

```tsx
useEffect(() => {
  const es = new EventSource(`/api/notifications/stream?sessionId=${sessionId}`);
  es.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === "workout_timer") {
      if (msg.data.type === "set_complete") {
        setCurrentSet(msg.data.setNumber + 1);
        playSound("set_complete");
      } else if (msg.data.type === "rest_complete") {
        setIsResting(false);
        playSound("default");
      }
    }
  };
  return () => es.close();
}, [sessionId]);
```

#### 1c. Backend: call `broadcastWorkoutTimerAlert` from `workout-session-service`

The backend already has the `NotificationBroadcaster` instance; expose it to the workout service or define an event emitter.

**Simplest:** Pass `NotificationBroadcaster` into `WorkoutSessionService` (or just call from `router.ts`).

```ts
// backend/src/modules/workouts/api/router.ts

// After a session is started:
const session = workoutSessionService.startSession(workoutId);
notificationBroadcaster.broadcastWorkoutTimerAlert({
  type: "set_complete",
  sessionId: session.id,
  exerciseName: "Push-ups",
  setNumber: 1,
  soundType: "chime",
});
```

For real implementation, the workout timer logic itself should drive these events (a 30s timer for rest periods, etc.). That logic belongs in the router or a new `workout-session-timer.ts` file.

### Verification
1. Open a workout detail page. Click "Start Workout".
2. Finish the first set. Verify `set_complete` alert fires (sound plays, counter increments).
3. Rest period ends. Verify `rest_complete` alert fires.
4. Complete all sets. Verify session is marked `completed` in DB.

---

## 2. Add Search to All List-Heavy Pages

### Problem
Habits, Tasks, Transactions, Workouts, and Sessions have no search. With 100+ items, users must visually scan to find one.

### Implementation Plan

#### 2a. Create shared `useDebounce` hook

**New file:** `frontend/src/lib/useDebounce.ts`

```tsx
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
```

#### 2b. Add search state + debounced query to every list page

**Example: HabitsPage.tsx**

```tsx
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);

const filteredHabits = useMemo(() => {
  if (!debouncedQuery) return habits;
  const lower = debouncedQuery.toLowerCase();
  return habits.filter((h) => h.name.toLowerCase().includes(lower));
}, [habits, debouncedQuery]);
```

Apply the same pattern to:
- `RoutinePage` (search task title)
- `FinancePage` (search transaction note)
- `WorkoutsPage` (search workout name)
- `SkillsPage` (search course/resource name)

#### 2c. Add search input to each card header

```tsx
<CardHeader>
  <CardTitle>Tasks</CardTitle>
  <div className="relative">
    <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
    <Input
      placeholder="Search tasks..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="pl-9 w-64"
    />
  </div>
</CardHeader>
```

#### 2d. (Optional) Backend search endpoint

For large datasets (>1000 rows), client-side `.filter()` will be slow. Add a backend `GET /api/routine/tasks?q=foo` with SQL `WHERE title ILIKE '%foo%'`. For a single-user local app with a few hundred rows, client-side is fine.

### Verification
1. Add 100 habits via script. Type "run" in search box. Confirm list filters within 300ms.
2. Clear search. Confirm full list returns.
3. Search for term that matches nothing. Confirm empty state message appears.

---

## 3. Add User Settings / Preferences Page

### Problem
The user cannot configure timezone, currency, notification volume, or default category presets. The app hardcodes BDT and Asia/Dhaka.

### Implementation Plan

#### 3a. Add settings data model to contracts (not backend-only)

The `UserSettings` type is consumed by the frontend too (for currency symbol, timezone selection). Define it in `packages/contracts/src/index.ts`, not in a backend-only file.

**File:** `packages/contracts/src/index.ts` (add)

```ts
export interface UserSettings {
  id: "singleton";
  timezone: string;        // e.g. "Asia/Dhaka", "America/New_York"
  currency: string;        // e.g. "BDT", "USD", "EUR"
  currencySymbol: string;  // e.g. "৳", "$"
  notificationVolume: number; // 0-100
  pollingIntervalMs: number;  // 30000 | 60000 | 120000
}
```

**New file:** `backend/src/modules/settings/application/settings-service.ts`

```ts
import type Database from "better-sqlite3";
import type { UserSettings } from "@lifeos/contracts";

const DEFAULTS: UserSettings = {
  id: "singleton",
  timezone: "Asia/Dhaka",
  currency: "BDT",
  currencySymbol: "৳",
  notificationVolume: 80,
  pollingIntervalMs: 60000,
};

export class SettingsService {
  constructor(private db: Database.Database) {}

  get(): UserSettings {
    const row = this.db.prepare("SELECT * FROM settings WHERE id = 'singleton'").get() as any;
    if (!row) return DEFAULTS;
    return {
      id: row.id,
      timezone: row.timezone,
      currency: row.currency,
      currencySymbol: row.currency_symbol,
      notificationVolume: row.notification_volume,
      pollingIntervalMs: row.polling_interval_ms,
    };
  }

  update(patch: Partial<UserSettings>): UserSettings {
    const current = this.get();
    const updated = { ...current, ...patch };
    this.db.prepare(`
      UPDATE settings SET
        timezone = ?,
        currency = ?,
        currency_symbol = ?,
        notification_volume = ?,
        polling_interval_ms = ?
      WHERE id = 'singleton'
    `).run(updated.timezone, updated.currency, updated.currencySymbol, updated.notificationVolume, updated.pollingIntervalMs);
    return updated;
  }
}
```

**Note:** The `settings` table is created by the migration runner (Phase 3.6, migration v2). Run `pnpm dev` after Phase 3.6 is implemented to apply it.

#### 3b. Add Settings route

```ts
// backend/src/modules/settings/api/router.ts
import { z } from "zod";
import { validateBody } from "../../../shared/validation.js";

const SettingsPatchSchema = z.object({
  timezone: z.string().optional(),
  currency: z.string().max(3).optional(),
  currencySymbol: z.string().max(10).optional(),
  notificationVolume: z.number().int().min(0).max(100).optional(),
  pollingIntervalMs: z.number().int().min(10000).max(300000).optional(),
});

const router = express.Router();

router.get("/", (req, res) => res.json(getSettings()));

router.patch("/", validateBody(SettingsPatchSchema), (req, res) => {
  const updated = updateSettings(req.body);
  res.json(updated);
});

export function createSettingsRouter() {
  return router;
}
```

Mount in `backend/src/index.ts`:
```ts
app.use("/api/settings", createSettingsRouter());
```

#### 3c. Build frontend Settings page

**New file:** `frontend/src/pages/SettingsPage.tsx`

```tsx
export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  // fetch GET /api/settings on mount; PATCH on form submit

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <form className="space-y-4">
          <Input
            label="Timezone"
            value={settings?.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          />
          <Input
            label="Currency Symbol"
            value={settings?.currencySymbol}
            onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
          />
          <Input
            label="Polling Interval (seconds)"
            type="number"
            value={settings?.pollingIntervalMs}
            // ...
          />
        </form>
      </Card>
    </div>
  );
}
```

Add route in `App.tsx`:
```tsx
<Route path="settings" element={<SettingsPage />} />
```

#### 3d. Wire settings through the app

- Use `settings.currencySymbol` in `FinancePage.formatBDT()`
- Use `settings.timezone` for future backend queries (currently Asia/Dhaka is assumed — replace `nowInDhaka()` with `nowInTimezone(settings.timezone)`)
- Expose a helper in `packages/contracts/src/date-utils.ts`:
  ```ts
  export function formatCurrency(amount: number, symbol: string): string {
    return `${symbol} ${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
  ```

### Verification
1. Open Settings. Change currency symbol to `$`. Go to Finance. Confirm amounts now show `$`.
2. Change timezone to `America/New_York` (future-proofing: currently backend hardcodes Asia/Dhaka, but the setting is stored and returned).
3. Save. Reload. Confirm the setting is sticky (server returns the new value).

---

## 4. Add Habit Weekly Heatmap to HabitsPage

### Problem
The backend has a `GET /api/habits/weekly-review` endpoint and the frontend has a `WeeklyReviewWidget` component in `frontend/src/modules/habits/WeeklyReviewWidget.tsx`, but **it is never imported or rendered on `HabitsPage`**.

### Implementation Plan

#### 4a. Verify `WeeklyReviewWidget` interface

Read the file. It likely expects `WeeklySummary[]` from the API and renders a 7-day grid per habit.

Ensure it accepts:
```tsx
interface Props {
  summaries: WeeklySummary[]; // from backend GET /api/habits/weekly-review
}
```

#### 4b. Render `WeeklyReviewWidget` on HabitsPage

**File:** `frontend/src/pages/HabitsPage.tsx`

```tsx
import { useHabits } from "../modules/habits/useHabits.js";

export default function HabitsPage() {
  const { habits, loading, ... } = useHabits();

  return (
    <div className="space-y-6">
      {/* ... existing header + habit list ... */}

      {/* NEW: Weekly review section */}
      <WeeklyReviewWidget habitIds={habits.map((h) => h.id)} />
    </div>
  );
}
```

Update `useHabits` to also fetch weekly review data:

```tsx
// frontend/src/modules/habits/useHabits.ts
const [weeklyReview, setWeeklyReview] = useState<WeeklySummary[]>([]);

useEffect(() => {
  api.getWeeklyReview().then(setWeeklyReview).catch(console.error);
}, []);
```

Pass `weeklyReview` to the widget.

#### 4c. Visual design alignment

Per DESIGN.md, WeeklyReview should render as a compact grid:
- 7 columns (Mon–Sun)
- Each cell colored by intensity (logged = accent color, not-logged = border-subtle)
- Row per habit

```tsx
<div className="grid grid-cols-8 gap-1 text-xs">
  <div /> {/* corner */ }
  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
    <div key={d} className="text-center text-muted">{d}</div>
  ))}
  {summaries.map((s) => (
    <>
      <div key={s.habitId} className="text-primary truncate">{s.habitName}</div>
      {s.days.map((d) => (
        <div key={d.date} className={`aspect-square rounded ${d.logged ? "bg-accent" : "bg-border-subtle"}`} />
      ))}
    </>
  ))}
</div>
```

### Verification
1. Open Habits. Scroll to the bottom. Confirm "This Week" heatmap appears.
2. Log a habit for today. Confirm the corresponding cell turns `bg-accent`.
3. View on a different day (mock `date` param to backend). Confirm only that day is highlighted.

---

## 5. Add Export (CSV) for All Modules

### Problem
Only a raw SQLite backup exists. Users cannot export habits, transactions, or workout history to CSV for analysis in Excel, Google Sheets, or external tools.

### Implementation Plan

#### 5a. Backend: add CSV export routes

**File:** `backend/src/modules/routine/api/router.ts`

```ts
import * as csv from "fast-csv"; // Add to package.json deps, or write a tiny stringifier

router.get("/tasks.csv", (req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="tasks-${todayInDhaka()}.csv"`);

  res.write("title,category,date,startTime,endTime,status,notes\n");

  for (const task of taskRepo.findByDate(todayInDhaka())) {
    res.write(
      [escapeCsv(task.title), task.category, task.date, task.startTime, task.endTime, task.status, escapeCsv(task.notes || "")]
        .join(",") + "\n"
    );
  }

  res.end();
});

function escapeCsv(value: string): string {
  return value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
}
```

#### 5b. Frontend: add download handlers to each page

**Utility:** `frontend/src/lib/download-csv.ts`

```ts
export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

Add a "Download CSV" button above each list:

```tsx
<Button
  variant="secondary"
  size="sm"
  icon={<DownloadIcon size={14} />}
  onClick={() => {
    fetch("/api/routine/tasks.csv")
      .then((r) => r.text())
      .then((csv) => downloadCsv(csv, `tasks-${todayInDhaka()}.csv`));
  }}
>
  Export
</Button>
```

**Modules to expose CSV for:**

| Module | Endpoint | Columns |
|--------|---------|---------|
| Routine | `GET /api/routine/tasks.csv` | title, category, date, startTime, endTime, status, notes |
| Habits | `GET /api/habits/history.csv` | habitName, date, logged (bool) |
| Finance | `GET /api/finance/transactions.csv` | date, account, category, amountMinor, note |
| Workouts | `GET /api/workouts/sessions.csv` | date, workoutName, duration, completed |

#### 5c. Frontend button placement

- Put an `icon={<DownloadIcon size={14} />}` secondary button in the `CardHeader` of each list.
- Show only when the list is non-empty (or always show; the CSV is empty if no data).

---

## 5b-rev. Add CSV Import for All Modules

**Category:** Data portability (export counterpart)

### Problem
Export exists but there is no import path. Users cannot migrate data *into* LifeOS from Excel, Google Sheets, or other tools. Without import, the CSV export feature is one-directional.

### Implementation Plan

#### Backend: CSV parse + validate + upsert

**New file:** `backend/src/shared/csv-import.ts`

```ts
export function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    // naive split; replace with a real CSV parser if fields contain commas
    const values = line.match(/(".*?"|[^,]+)/g)?.map((v) => v.trim().replace(/^"|"$/g, "")) || [];
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
    return row;
  });
}
```

Import endpoint on each router uses `multer` (or raw body) to receive the file, calls `parseCsv`, and writes rows inside a transaction. Reuse the module's Zod schema to reject bad rows and return a per-row error report:

```ts
router.post("/import", async (req, res) => {
  const csv = parseCsv(req.body);
  let imported = 0, errors: string[] = [];
  for (const row of csv) {
    const parsed = NewTaskInputSchema.safeParse(row);
    if (!parsed.success) { errors.push(`Row ${imported + 1}: ${parsed.error.message}`); continue; }
    db.prepare("INSERT INTO tasks ...").run(parsed.data);
    imported++;
  }
  res.json({ imported, errors });
});
```

#### Frontend: drag/drop importer

**New file:** `frontend/src/components/ui/CsvImport.tsx`

```tsx
export function CsvImport({ endpoint, onDone }: { endpoint: string; onDone?: () => void }) {
  const [state, setState] = useState<"idle" | "error" | "success">("idle");
  const [report, setReport] = useState<{ imported: number; errors: string[] } | null>(null);
  const onDrop = async (file: File) => {
    const text = await file.text();
    const res = await fetch(endpoint, { method: "POST", body: text, headers: { "Content-Type": "text/csv" } });
    const data = await res.json();
    if (data.errors?.length) { setState("error"); setReport(data); }
    else { setState("success"); setReport(data); onDone?.(); }
  };
  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files[0]!); }}>
      {state === "error" && <p className="text-sm text-danger">{report?.errors.join(", ")}</p>}
      {state === "success" && <p className="text-sm text-success">Imported {report?.imported} rows.</p>}
      <p className="text-xs text-muted">Drop a CSV here to import.</p>
    </div>
  );
}
```

Place the importer above each list in `RoutinePage`, `HabitsPage`, `FinancePage`, `WorkoutsPage`.

### Verification
1. Export a CSV, edit one row, re-import. Confirm the edit is applied (update-or-insert semantics).
2. Import a CSV with a validation error. Confirm the error report lists the bad row and the good rows are still imported.
3. Import a 1000-row CSV. Confirm it completes without blocking the UI.
3. Add a task with a comma in the title (`"Buy milk, eggs"`). Confirm the CSV correctly quotes the field.

---

## 6. Add Confirmation Dialog Before Destructive Actions

### Problem
Delete buttons for habits, tasks, and categories have no confirmation. A stray click permanently removes data.

### Implementation Plan

#### 6a. Use shared `Modal` as confirmation dialog

**New file:** `frontend/src/components/ui/ConfirmDialog.tsx`

```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
```

#### 6b. Wire into RoutinePage

```tsx
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

const handleDelete = async (id: string) => {
  setDeleteTarget(id);
};

const confirmDelete = async () => {
  if (!deleteTarget) return;
  await api.deleteTask(deleteTarget);
  toast.success("Task deleted");
  setDeleteTarget(null);
  fetchTasks();
};

// In JSX:
<ConfirmDialog
  open={!!deleteTarget}
  title="Delete task"
  message="Are you sure? This action cannot be undone."
  onConfirm={confirmDelete}
  onCancel={() => setDeleteTarget(null)}
/>
```

Replace every `onClick={() => handleDelete(task.id)}` with `onClick={() => setDeleteTarget(task.id)}`.

#### 6c. Apply to all destructive actions

- Habits: removeHabit
- Skills: removeSession, removeCourse, removeCategory
- Finance: delete account / category (if allowed)

### Verification
1. Click delete on a task. Confirm dialog appears.
2. Click "Cancel". Confirm task still exists.
3. Click delete, confirm dialog, click "Delete". Confirm task is gone and success toast fires.

---

## 7. Add Basic Authentication (Optional but Recommended)

### Problem
The app has no authentication. If the backend port is exposed (LAN, shared machine, or port forwarding), anyone can read/write all data. For a personal productivity tool, this is a data privacy risk.

### Implementation Plan

#### 7a. Add a simple password gate (not full auth)

Since this is a single-user local app, full user auth (OAuth, JWT sessions) is overkill. A simple shared password gate is sufficient.

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

---

## 8. Add Automated Backup Endpoint and Scheduled Backup

### Problem
The existing `GET /api/backup` endpoint (if it exists) is never called automatically. If the DB corrupts or the user accidentally deletes data, there's no recovery path.

### Implementation Plan

#### 8a. Verify/create backup endpoint

**File:** `backend/src/modules/backup/api/router.ts`

```ts
import * as fs from "node:fs";
import * as path from "node:path";
import express from "express";

export function createBackupRouter(dbPath: string) {
  const router = express.Router();

  router.get("/", (req, res) => {
    const backupPath = dbPath + ".backup";
    fs.copyFileSync(dbPath, backupPath);

    // Also copy WAL if present
    const walPath = dbPath + "-wal";
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, backupPath + "-wal");
    }

    res.download(backupPath, `lifeos-backup-${new Date().toISOString().slice(0, 10)}.sqlite`, (err) => {
      // Clean up temp file after download
      try { fs.unlinkSync(backupPath); } catch {}
      if (err) res.status(500).json({ error: "Backup failed" });
    });
  });

  return router;
}
```

#### 8b. Auto-backup on startup

**File:** `backend/src/index.ts`

```ts
import * as fs from "node:fs";

// Create a backup every day on startup
const backupDir = path.join(path.dirname(DB_PATH), "backups");
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const dailyBackup = path.join(backupDir, `lifeos-${today}.sqlite`);
if (!fs.existsSync(dailyBackup)) {
  fs.copyFileSync(DB_PATH, dailyBackup);
  console.log(`[backup] Created daily backup: ${dailyBackup}`);
}

// Prune backups older than 30 days
const maxAge = 30 * 24 * 60 * 60 * 1000;
for (const file of fs.readdirSync(backupDir)) {
  const filePath = path.join(backupDir, file);
  const stat = fs.statSync(filePath);
  if (Date.now() - stat.mtimeMs > maxAge) {
    fs.unlinkSync(filePath);
    console.log(`[backup] Pruned old backup: ${file}`);
  }
}
```

### Verification
1. Run `pnpm dev`. Check `backend/data/backups/` — a file `lifeos-YYYY-MM-DD.sqlite` should appear.
2. Restart the app on the same day. No duplicate backup should be created.
3. `GET /api/backup` should download a valid `.sqlite` file.
4. Verify backups older than 30 days are pruned (manually create an old file to test).

---

## 9. Add Error Monitoring / Structured Logging

### Problem
Phase 1.5 adds toast notifications for user-facing errors. But backend errors (failed DB writes, unhandled promise rejections, SSE broadcast failures) are only visible in the terminal. For debugging production issues, structured logging is essential.

### Implementation Plan

#### 9a. Add a lightweight logger

**New file:** `backend/src/shared/logger.ts`

```ts
type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL as LogLevel] ?? LEVELS.info;

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < currentLevel) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
```

#### 9b. Replace console.log/error in backend with logger

**Before:**
```ts
console.log(`[startup] DATABASE_PATH resolved to: ${resolved}`);
console.error(`Heartbeat failed for client ${clientId}:`, error);
```

**After:**
```ts
logger.info("Database initialized", { path: resolved });
logger.error("SSE heartbeat failed", { clientId, error: String(error) });
```

#### 9c. Add global unhandled rejection handler

**File:** `backend/src/index.ts`

```ts
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1); // Exit after uncaught — DB may be in inconsistent state
});
```

### Verification
1. Set `LOG_LEVEL=debug` in `.env`. Restart. Confirm debug-level messages appear.
2. Trigger an error (e.g., send invalid JSON to a POST endpoint). Confirm structured JSON error appears in logs.
3. Kill the DB file mid-request. Confirm `unhandledRejection` is logged with context.

---

## 10. Add Lightweight State Management

### Problem
The app currently relies on React `useState` + prop drilling for shared state. The toast context (Phase 1.5) and SSE hooks (Phase 3.1) each introduce their own ad-hoc context providers. As the app grows, this pattern leads to:
- Deeply nested providers in `App.tsx`
- Components re-rendering when unrelated state changes
- No simple way to share cross-module state (e.g., settings → finance currency symbol)

### Implementation Plan

#### 10a. Introduce Zustand (recommended) or Jotai

Both are lightweight (Zustand ~1 KB gzipped, Jotai ~3 KB) and require zero boilerplate. Zustand is recommended for this app because:
- It fits the "multiple independent stores" model well (one store per module)
- No context providers needed — stores are imported directly
- Works outside React (e.g., in API interceptors)

**New file:** `frontend/src/stores/settings.ts`

```ts
import { create } from "zustand";
import type { UserSettings } from "@lifeos/contracts";

interface SettingsStore {
  settings: UserSettings | null;
  setSettings: (s: UserSettings) => void;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  updateSettings: async (patch) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const updated = await res.json();
    set({ settings: updated });
  },
}));
```

#### 10b. Identify store boundaries

| Store | State | Consumed by |
|--------|-------|-------------|
| `settings` | timezone, currency, notification prefs | Finance, all pages |
| `toast` | toast queue (already exists as context) | All pages |
| `dashboard` | SSE summary (can stay as hook) | Dashboard only |
| `notifications` | unread count + last notification | Bell, NotificationsPage |

Only create stores when state is shared across >1 component. Single-page state (e.g., form state) should stay as local `useState`.

#### 10c. Migrate Phase 1.5 toast context to Zustand (optional)

Keep the existing `ToastContext` if it's working. The value of Zustand is for new cross-cutting concerns like settings, not for rewriting working code.

### Dependencies
- Phase 4.3 (Settings page) — the settings store is the strongest use case.

### Verification
1. Open Settings page, change currency symbol to `$`. Navigate to Finance — amounts update without a page reload.
2. Verify Zustand stores are not serialized/ persisted unless explicitly added (no accidental data leaks).
3. Measure bundle size impact: confirm Zustand adds < 2 KB to the bundle.

---

## 11. Add Bulk Data Management (Archive / Purge)

### Problem
A productivity app accumulates data over years. Habits logged daily for 5 years = 1,825 rows. Transactions added weekly = hundreds per year. There is no way to archive old data or purge it, so the database grows without bound. Queries like `SELECT * FROM tasks` will eventually slow down, and the backup file grows.

### Implementation Plan

#### 11a. Add archive button for each module

**File:** `frontend/src/pages/RoutinePage.tsx` (example)

```tsx
// Add to CardHeader:
<Button
  variant="secondary"
  size="sm"
  onClick={() => setShowArchive(true)}
  icon={<ArchiveIcon size={14} />}
>
  Archive old
</Button>

// Modal content:
<ConfirmDialog
  open={showArchive}
  title="Archive completed tasks"
  message="Move tasks older than 30 days to archive. They will not appear in the dashboard but can be restored."
  confirmLabel="Archive"
  onConfirm={async () => {
    await api.archiveTasks({ before: getClientDateString() });
    toast.success(`Archived ${count} tasks`);
    fetchTasks();
  }}
  onCancel={() => setShowArchive(false)}
/>
```

#### 11b. Backend: archive tables or soft-delete flag

**Option A (recommended):** Add an `archived` boolean column to relevant tables. The default query filters `WHERE archived = 0`. Archive endpoints set `archived = 1`.

```sql
ALTER TABLE tasks ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE habit_logs ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
```

**Migration (Phase 3.6):** This migration should be version 5 (after v3 from Phase 1.2 column renames and v4 from Phase 3.6 settings table). Do NOT use v3 — that version already renames `reminderMinutesBefore` → `reminder_minutes_before`. Using a different version number prevents conflicts.

```ts
{
  version: 5,
  name: "add_archived_columns",
  up: (db) => {
    db.exec(`ALTER TABLE tasks ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
    db.exec(`ALTER TABLE transactions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
    db.exec(`ALTER TABLE habit_logs ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`);
  },
}
```

**Note:** If the app uses PostgreSQL-style `IF NOT EXISTS` for ALTER TABLE (SQLite 3.35+), this migration is safe to run multiple times. For older SQLite, add a guard:

```ts
db.exec(`
  CREATE TABLE IF NOT EXISTS _archived_migration_guard (id INTEGER PRIMARY KEY);
`);
```

**Option B (simpler but irreversible):** `DELETE FROM tasks WHERE date < date('now', '-1 year')`. Only suitable for users who explicitly confirm "permanently delete old data."

#### 11c. Backend archive endpoints

```ts
// POST /api/routine/archive
router.post("/archive", (req, res) => {
  const { before } = req.body; // "YYYY-MM-DD"
  const result = db.prepare("UPDATE tasks SET archived = 1 WHERE date < ?").run(before);
  res.json({ archived: result.changes });
});

// GET /api/routine/archived
router.get("/archived", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks WHERE archived = 1 ORDER BY date DESC LIMIT 100").all();
  res.json(rows);
});

// POST /api/routine/archived/:id/restore
router.post("/archived/:id/restore", (req, res) => {
  db.prepare("UPDATE tasks SET archived = 0 WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
```

#### 11d. Apply to all data-heavy modules

| Module | Archive condition | Retained for |
|--------|-------------------|-------------|
| Routine | Tasks with `status = done` and `date < 30 days ago` | 30 days |
| Habits | Habit logs with `date < 6 months ago` | 6 months |
| Finance | Transactions with `date < 1 year ago` | 1 year |
| Workouts | Sessions older than 6 months | 6 months |

### Dependencies
- Phase 3.6 (migration runner) — needed for the `archived` column migration.
- Phase 4.6 (ConfirmDialog) — archive actions need confirmation.
- Phase 4.5 (CSV export) — users should export before archiving.

### Verification
1. Create a task dated 60 days ago. Click "Archive old". Confirm task disappears from the dashboard.
2. Call `GET /api/routine/archived`. Confirm the task appears.
3. Restore the task. Confirm it reappears on the dashboard.
4. Verify migration v5 is applied (`SELECT * FROM _migrations` includes version 5).
5. Verify no existing data is affected (migration runs `ADD COLUMN` which defaults to 0 for existing rows).

---

## 12. Add CSV Import for All Modules

### Problem
Phase 4.5 adds CSV export for all modules, but there is no import path. Users cannot migrate data *into* LifeOS from Excel, Google Sheets, or other tools. Without import, the CSV export feature is one-directional and less useful.

### Implementation Plan

#### 12a. Backend: add CSV import routes

**New file:** `backend/src/shared/csv-import.ts`

```ts
import * as fs from "node:fs";

export function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  
  return lines.slice(1).map((line) => {
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i]?.replace(/^"|"$/g, "").trim() || "";
    });
    return row;
  });
}

export function validateCsvRow(row: Record<string, string>, requiredFields: string[]): string[] {
  const errors: string[] = [];
  for (const field of requiredFields) {
    if (!row[field] || !row[field].trim()) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return errors;
}
```

**Example endpoint:** `backend/src/modules/routine/api/router.ts`

```ts
import multer from "multer"; // For file upload handling
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single("file"), async (req, res) => {
  const csvContent = req.file?.buffer?.toString() || "";
  const rows = parseCsv(csvContent);
  
  let imported = 0;
  let errors = 0;
  
  for (const row of rows) {
    try {
      const validated = NewTaskInputSchema.parse(row);
      await taskRepo.create(validated);
      imported++;
    } catch {
      errors++;
    }
  }
  
  res.json({ imported, errors });
});
```

#### 12b. Frontend: add import UI component

**New file:** `frontend/src/components/ui/CsvImport.tsx`

```tsx
interface CsvImportProps {
  endpoint: string;
  onSuccess?: (result: { imported: number; errors: number }) => void;
}

export function CsvImport({ endpoint, onSuccess }: CsvImportProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const result = await res.json();
    setUploading(false);
    
    if (result.errors > 0) {
      toast.error(`${result.errors} rows failed validation`);
    } else {
      toast.success(`${result.imported} rows imported`);
    }
    
    onSuccess?.(result);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        dragging ? "border-accent bg-accent/10" : "border-border hover:border-border-subtle"
      }`}
    >
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading ? (
        <p className="text-muted">Uploading...</p>
      ) : (
        <p className="text-sm text-secondary">
          Drag & drop a CSV file here, or click to select
        </p>
      )}
    </div>
  );
}
```

#### 12c. Wire into each page's CardHeader

```tsx
<CardHeader>
  <CardTitle>Tasks</CardTitle>
  <div className="flex gap-2">
    <CsvImport endpoint="/api/routine/import" onSuccess={() => fetchTasks()} />
    <Button variant="secondary" size="sm" icon={<DownloadIcon size={14} />}>
      Export CSV
    </Button>
  </div>
</CardHeader>
```

**Modules to support import:**

| Module | CSV columns | Required fields |
|--------|------------|-----------------|
| Routine | title, category, date, startTime, endTime, status, notes | title, category, date |
| Habits | habitName, date, logged (bool) | habitName, date |
| Finance | date, account, category, amountMinor, note | date, account, category, amountMinor |
| Workouts | workoutName, date, duration, completed | workoutName, date |

### Dependencies
- Phase 4.5 (CSV export) — import/export are complementary features.
- Phase 2.3 (Zod schemas) — use existing schemas for validation.

### Verification
1. Export tasks to CSV, modify one row, re-import. Confirm the modified row is updated.
2. Import a CSV with invalid dates. Confirm the error count reflects bad rows.
3. Import a large CSV (1000+ rows). Confirm import completes in <2s.
