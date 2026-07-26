# Phase 3: Performance

> Once the app is correct, make it fast. Target: no perceptible lag on any interaction, minimal battery drain from background polling.

## 1. Replace Polling with SSE for Routines/Dashboard (Deferred)

> **DEFERRED.** This is low priority for a local-first SQLite app. The 30s polling is not a real performance bottleneck — the DB queries complete in <10ms and the HTTP overhead is negligible on localhost. SSE adds complexity (dual channels, reconnection logic, stale client cleanup) without a meaningful user-facing improvement. **Only implement this if profiling shows polling is causing measurable CPU/battery drain.** The Finance page triple-fetch (Phase 3.2) is a higher-impact optimization.

If implemented later, use the following corrected hook to avoid the retry-timer leak described in Phase 3 Known Issues:

```tsx
// frontend/src/modules/dashboard/useDashboardSSE.ts
import { useEffect, useState, useCallback, useRef } from "react";

export function useDashboardSSE() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const eventSource = new EventSource("/api/dashboard/stream");

    eventSource.onopen = () => setConnected(true);
    eventSource.onmessage = (ev) => {
      try {
        setSummary(JSON.parse(ev.data));
      } catch { setError("Failed to parse dashboard data"); }
    };
    eventSource.onerror = () => {
      setConnected(false);
      setError("Connection lost, retrying...");
      // FIX: clear any previous timeout before scheduling a new one
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        eventSource.close();
        connect();
      }, 3000);
    };

    return () => {
      eventSource.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return cleanup; // cleanup runs on unmount AND when `connect` changes
  }, [connect]);

  return { summary, error, connected };
}
```

---

## 2. Add API Response Cache with TTL

### Problem
`FinancePage` calls `Promise.all([getAccounts, getTransactions, getCategories])` on mount and **re-fetches all three** after every create/update/delete. With 3 endpoints × 0.5s latency, post-mutation UI flickers for 1–1.5s every time.

### Implementation Plan

#### 2a. Create a lightweight cache

**New file:** `frontend/src/lib/cache.ts`

```ts
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs = 30_000) {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) this.store.delete(key);
    }
  }
}

export const apiCache = new ApiCache();
```

#### 2b. Wrap `api.get*` calls to read from cache first

**File:** `frontend/src/modules/finance/api.ts` *(update existing file)*

```ts
import { apiCache } from "../../../lib/cache.js";

export async function fetchAccountBalances() {
  const cached = apiCache.get<AccountWithBalance[]>("/finance/accounts");
  if (cached) return cached;

  const data = await fetch("/api/finance/accounts").then(r => r.json());
  apiCache.set("/finance/accounts", data, 45_000);
  return data;
}
```

Apply the same pattern to:
- `fetchMonthlyTransactions` (cache key: `/finance/transactions?month=YYYY-MM`)
- `fetchActiveCategories`
- `getSkillAreas`
- `getExercises`

#### 2c. Invalidate cache after mutations

```ts
// POST /api/finance/transactions
const handleSubmit = async (input) => {
  await financeApi.createTransaction(input);
  apiCache.invalidate("/finance/transactions");
  apiCache.invalidate("/finance/accounts");
  fetchData(); // Re-fetch stale data
};
```

#### 2d. Optional: add offline queue (future)

For Phase 3 just do cache. If the user goes offline, show "offline" badge rather than failing.

### Verification
1. Open Finance page. Check Network tab: 3 requests fire.
2. Create a transaction. Check Network: only the POST request fires (no 3 GETs).
3. Manually call `apiCache.invalidate("/finance/accounts")` from devtools. Confirm next render refetches.
4. Verify cache TTL: wait 45s, refresh page, confirm 3 GETs fire again (stale cache evicted).

---

## 3. Memoize Expensive Lookups

### Problem
`FinancePage.tsx` recomputes `categories.find(...)` for every transaction render:

```tsx
const totalIncome = transactions
  .filter((t) => categories.find((c) => c.id === t.categoryId)?.kind === "income")
  .reduce((s, t) => s + t.amountMinor, 0);
```

With 500 transactions and 20 categories, this is O(transactions × categories) per render.

`render` happens on every keystroke in the modal (because `setOpen` toggles a state called `showForm` on the parent), which is O(N) work on each keypress — fine for N=500 but unnecessary.

### Implementation Plan

#### 3a. Pre-compute category maps with `useMemo`

**File:** `frontend/src/pages/FinancePage.tsx`

```tsx
import { useMemo } from "react";

const categoryMap = useMemo(() => {
  const map = new Map<string, Category>();
  for (const c of categories) map.set(c.id, c);
  return map;
}, [categories]);

const totalIncome = useMemo(
  () => transactions
    .filter((t) => categoryMap.get(t.categoryId)?.kind === "income")
    .reduce((sum, t) => sum + t.amountMinor, 0),
  [transactions, categoryMap]
);

const totalExpense = useMemo(
  () => transactions
    .filter((t) => categoryMap.get(t.categoryId)?.kind === "expense")
    .reduce((sum, t) => sum + t.amountMinor, 0),
  [transactions, categoryMap]
);
```

#### 3b. Memoize transaction list rendering

If the list grows beyond 200 items, React will re-render the entire `transactions.map(...)` on every parent state change (e.g., `setShowForm` in the modal).

**Option A (fast, no new dep):** Split the transactions list into a separate component stabilized with `React.memo`.

```tsx
const TransactionList = React.memo(function TransactionList({ transactions, categoryMap }: { transactions: Transaction[]; categoryMap: Map<string, Category> }) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {transactions.map((t) => (
        // ...
      ))}
    </div>
  );
});
```

**Option B (preferred for 1000+ items):** Use `@tanstack/react-virtual` to only render visible rows. For a local-first single-user app, Option A is usually enough.

#### 3c. Apply the same pattern to HabitsPage, RoutinePage, WorkoutsPage

Any `.map(...)` over a list larger than 50 items should pre-compute lookup maps with `useMemo`.

### Verification
1. Add `console.time` / `console.timeEnd` around the render body of `FinancePage`. Open Form. Confirm the "render" time is < 2ms with 500 items.
2. Add React DevTools Profiler. Verify `TransactionList` is not re-rendered when the modal opens.

---

## 4. Stop Polling When Tab Is Hidden

### Problem
`RoutinePage` and `DashboardPage` use `setInterval(fetchTasks, 30000)`. When the tab is hidden:
- Browsers throttle timers to ≥ 1 min (Chrome) or ≥ 5 min (Firefox), so the 30s timer already doesn’t fire.
- But the scheduler *woke up* to throttle still costs power.
- For a local-first app, 30/60 s is too aggressive when the user isn’t looking.

### Implementation Plan

#### 4a. Pause/resume interval on visibility change

**Hook:** `frontend/src/lib/useVisibilityPolling.ts`

```tsx
import { useEffect, useRef } from "react";

export function useVisibilityPolling(callback: () => void, intervalMs = 60_000) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const start = () => { timer = setInterval(savedCallback.current, intervalMs); };
    const stop = () => clearInterval(timer);

    start();

    const onVisible = () => {
      stop();
      savedCallback.current(); // immediate refresh on tab switch back
      start();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
}
```

#### 4b. Replace direct `setInterval` in RoutinePage

```tsx
const fetchTasks = useCallback(async () => {
  // ... existing logic
}, [date]);

useVisibilityPolling(fetchTasks, 60_000);
// Remove the manual setInterval + visibilitychange listener from RoutinePage.
```

#### 4c. Replace in DashboardPage (if still polling as fallback)

If Dashboard is using SSE (Phase 3.1), this hook is unnecessary. Keep it as a fallback only.

#### 4d. Increase default interval from 30s → 60s

With SSE handling real-time updates, the fallback polling interval can be 60s. Update constant `POLL_INTERVAL = 30_000` → `60_000` in any remaining pollers.

### Verification
1. Set a breakpoint in `fetchSummary`. Hide DevTools or switch to another tab. Confirm the breakpoint **does not hit**.
2. Return to the tab within 5s. Confirm it fires once immediately.
3. Battery Profiler (macOS): compare idle CPU % with and without the fix. Expect drop to near-zero.

---

## 5. Add Code Splitting (Lazy-Load Pages)

### Problem
Vite builds a single JS bundle containing every page. Users on slow connections must download everything even if they only use the Dashboard.

### Implementation Plan

#### 5a. Lazy-load pages with `React.lazy`

**File:** `frontend/src/App.tsx`

```tsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.js"));
const RoutinePage = lazy(() => import("./pages/RoutinePage.js"));
const HabitsPage = lazy(() => import("./pages/HabitsPage.js"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage.js"));
const SkillsPage = lazy(() => import("./pages/SkillsPage.js"));
const FinancePage = lazy(() => import("./pages/FinancePage.js"));
const NewsPage = lazy(() => import("./pages/NewsPage.js"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.js"));

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
      <div className="h-32 bg-gray-800/60 rounded-xl animate-pulse" />
      <div className="h-24 bg-gray-800/60 rounded-xl animate-pulse" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={
          <Suspense fallback={<PageSkeleton />}>
            <DashboardPage />
          </Suspense>
        } />
        {/* ... repeat for every route */}
      </Route>
    </Routes>
  );
}
```

#### 5b. Configure Vite for manual chunk splitting

**File:** `frontend/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-router-dom", "react-dom"],
        },
      },
    },
  },
});
```

#### 5c. Update docs/DEVELOPMENT.md if present (optional)

Document the lazy-loading pattern so future contributors know to `React.lazy` new pages.

### Verification
1. Run `pnpm run build`. Check `dist/assets/`: there should be `vendor-react.[hash].js` and individual `DashboardPage.[hash].js`, etc.
2. Open the app in Chrome; in Network tab, only `DashboardPage.[hash].js` and `vendor-react.[hash].js` load.
3. Navigate to Finance. Confirm `FinancePage.[hash].js` loads only then.
4. Measure Time to First Byte (TTFB) and First Contentful Paint (FCP) via Lighthouse — expect improvement.

---

## 6. Add Database Migration Runner

### Problem
Phase 1.3 renames contract types. Phase 4.3 adds a `settings` table. Without a migration strategy, schema changes will break existing databases silently or require manual SQL. Even a simple runner prevents the "works on my machine, breaks on deploy" pattern.

### Implementation Plan

#### 6a. Create a migrations directory and runner

**New file:** `backend/src/shared/migrations.ts`

```ts
import type Database from "better-sqlite3";

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial",
    up: (db) => {
      // No-op: schema already exists in existing installs.
      // New installs get the schema from seed/migration 0.
    },
  },
  {
    version: 2,
    name: "add_settings_table",
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY DEFAULT 'singleton',
          timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
          currency TEXT NOT NULL DEFAULT 'BDT',
          currency_symbol TEXT NOT NULL DEFAULT '৳',
          notification_volume INTEGER NOT NULL DEFAULT 80,
          polling_interval_ms INTEGER NOT NULL DEFAULT 60000
        );
        INSERT OR IGNORE INTO settings (id) VALUES ('singleton');
      `);
    },
  },
  {
    version: 3,
    name: "add_reminder_nullable_fields",
    up: (db) => {
      // Phase 1.2: allow null for reminder fields
      db.exec(`ALTER TABLE tasks RENAME COLUMN reminderMinutesBefore TO reminder_minutes_before`);
      db.exec(`ALTER TABLE tasks RENAME COLUMN reminderSound TO reminder_sound`);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);

  const applied = new Set(
    db.prepare("SELECT version FROM _migrations").all().map((r: any) => r.version)
  );

  for (const migration of migrations) {
    if (!applied.has(migration.version)) {
      console.log(`[migration] Applying v${migration.version}: ${migration.name}`);
      db.transaction(() => {
        migration.up(db);
        db.prepare("INSERT INTO _migrations (version, name) VALUES (?, ?)").run(
          migration.version,
          migration.name
        );
      })();
    }
  }
}
```

#### 6b. Call on startup

**File:** `backend/src/shared/db.ts` (or wherever the DB is initialized)

```ts
import { runMigrations } from "./migrations.js";

export function createDatabase(dbPath: string) {
  // ... existing path guard code ...
  const db = new Database(resolved);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db); // <-- add this

  return db;
}
```

#### 6c. Naming conventions for future migrations

- Files: `backend/src/shared/migrations.ts` (single file, all migrations inline) — simple for a solo project.
- If the file grows beyond ~20 migrations, split into `backend/src/migrations/001_name.ts` etc.
- Each migration gets a sequential `version` number and a descriptive `name`.
- Never modify an applied migration. Always add a new one.

### Verification
1. Delete the existing DB. Run `pnpm dev`. Confirm all tables are created including `settings` and `_migrations`.
2. Run again with an existing DB. Confirm only new migrations are applied (check logs).
3. Verify `SELECT * FROM _migrations` shows all applied versions.

---

## 7. Clean Up SSE Heartbeat Stale Clients

### Problem
`NotificationBroadcaster` (`backend/src/modules/notifications/application/notification-broadcaster.ts`) writes `lastHeartbeat: Date.now()` into the SSE client record, but **never checks if the client has gone silent**. A dead TCP connection stays in `this.clients` forever, so every heartbeat write throws and is caught (and logs an error) for every dead client.

### Implementation Plan

#### 7a. Add staleness check in the heartbeat loop

In `NotificationBroadcaster.sendHeartbeat()`:

```ts
const STALE_MS = 90_000;

private sendHeartbeat(): void {
  const now = Date.now();
  for (const [clientId, client] of this.clients) {
    try {
      if (now - client.lastHeartbeat > STALE_MS) {
        console.warn(`Removing stale SSE client ${clientId}`);
        this.removeClient(clientId);
        continue;
      }
      client.response.write(`: heartbeat ${now}\n\n`);
      client.lastHeartbeat = now;
    } catch (error) {
      console.error(`Heartbeat failed for client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }
}
```

#### 7b. Update `lastHeartbeat` on any client write

In `sendToAllClients`, also update `lastHeartbeat` when data is successfully sent:

```ts
client.lastHeartbeat = Date.now(); // update on activity too
```

### Verification
1. Connect a client, then kill the tab (`eventSource.close()` not called). Wait 90s.
2. Observe backend log: "Removing stale SSE client ..." should appear once.
3. Repeat with 500 rapid connects/disconnects. Confirm no leak in `getClientCount()` over time.

---

## 8. Add Database Indexes for Query Performance

### Problem
Phase 4.12 (Bulk Data) and existing queries will degrade significantly as data grows. Without indexes on frequently filtered columns, SQLite must perform full table scans on every query. This affects:
- `tasks.date` — filtered by date on Dashboard and Routine pages
- `habit_logs.habit_id + habit_logs.date` — habit streak calculations
- `transactions.account_id` — Finance page account lookups
- `transactions.category_id` — Finance page category filtering
- `workout_sessions.workout_id` — workout history queries
- `archived` column — all modules will filter by `WHERE archived = 0`

### Implementation Plan

#### 8a. Add indexes via migration runner

**File:** `backend/src/shared/migrations.ts`

Add migration v5 (after v3 from Phase 3.6 and v4 from Phase 4.12):

```ts
{
  version: 5,
  name: "add_query_indexes",
  up: (db) => {
    // Tasks — most frequently queried table
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived)`);
    
    // Habit logs — composite index for streak queries
    db.exec(`CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date)`);
    
    // Transactions — account and category lookups
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_archived ON transactions(archived)`);
    
    // Workout sessions
    db.exec(`CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout ON workout_sessions(workout_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date)`);
    
    // Learning sessions
    db.exec(`CREATE INDEX IF NOT EXISTS idx_learning_sessions_skill ON learning_sessions(skill_category_id)`);
  },
}
```

#### 8b. Verify query plans

After applying the migration, confirm SQLite uses indexes:

```sql
EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE date = '2025-01-01';
-- Expected: SCAN TABLE tasks USING INDEX idx_tasks_date

EXPLAIN QUERY PLAN SELECT * FROM habit_logs WHERE habit_id = 'abc' AND date > '2025-01-01';
-- Expected: SCAN USING INDEX idx_habit_logs_habit_date
```

If a query still shows `SCAN TABLE ... USING COVERING INDEX`, the index is working. If it shows `SCAN TABLE ... USING TABLE SCAN`, the index was not created or is not applicable.

#### 8c. Clean up unused indexes

Run this monthly to identify indexes that are never used:

```sql
SELECT * FROM sqlite_stat1;
-- Or use EXPLAIN QUERY PLAN on all known queries and cross-reference with PRAGMA index_list(tasks);
```

SQLite does not auto-drop unused indexes, so this is a manual audit.

### Dependencies
- Phase 3.6 (migration runner) — indexes are added via migration.
- Phase 4.12 (archive columns) — `archived` index should be created alongside the archive column migration.

### Verification
1. Delete the DB, run `pnpm dev`. Confirm `_migrations` includes version 5.
2. Run `EXPLAIN QUERY PLAN` on Dashboard task query. Confirm `idx_tasks_date` is used.
3. Insert 10,000 dummy tasks. Confirm `SELECT * FROM tasks WHERE date = '2025-01-01'` completes in <5ms.
2. Observe backend log: "Removing stale SSE client ..." should appear once.
3. Repeat with 500 rapid connects/disconnects. Confirm no leak in `getClientCount()` over time.

---

## 8. Add Bundle Analysis and Size Budget

### Problem
Phase 3.5 adds code splitting but has no visibility into bundle size. A developer can accidentally import a heavy library (e.g., `moment`, `lodash`) and inflate the main bundle without noticing. Without a size budget, bundle size regressions go undetected.

### Implementation Plan

#### 8a. Add `vite-plugin-visualizer` for bundle analysis

**File:** `frontend/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-router-dom", "react-dom"],
        },
      },
    },
  },
});
```

#### 8b. Add size-limit configuration

**New dev dependency:** `size-limit` + `@size-limit/file` + `@size-limit/esbuild-why`

**File:** `frontend/package.json` (add)

```json
{
  "size-limit": [
    {
      "name": "Main JS bundle",
      "path": "dist/assets/*.js",
      "limit": "250 KB",
      "running": false
    },
    {
      "name": "Main CSS bundle",
      "path": "dist/assets/*.css",
      "limit": "50 KB"
    }
  ],
  "scripts": {
    "size": "size-limit",
    "size:ci": "size-limit --ci"
  }
}
```

**Alternative (lighter weight):** Use `vite-plugin-limit` instead of `size-limit` for tighter Vite integration.

#### 8c. Wire into CI (Phase 5.3)

Add a CI step after the build:

```yaml
- name: Check bundle size
  run: pnpm --filter @lifeos/frontend size:ci
```

#### 8d. Establish a performance budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Main JS bundle | <250 KB gzipped | `size-limit` |
| Main CSS bundle | <50 KB gzipped | `size-limit` |
| Time to Interactive (TTI) | <2s on fast 3G | Lighthouse |
| First Contentful Paint (FCP) | <1.5s | Lighthouse |

### Dependencies
- Phase 3.5 (code splitting) should be implemented first for accurate baseline.

### Verification
1. Run `pnpm --filter @lifeos/frontend size`. Confirm output shows bundle sizes under the limits.
2. Open `dist/stats.html` in a browser. Confirm visual treemap shows vendor-react as the largest chunk.
3. Intentionally add `import moment from "moment"` — `pnpm run size` should fail the budget.
