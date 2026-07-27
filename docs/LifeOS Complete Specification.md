# LifeOS — Complete Project Specification

> Source-of-truth document for generating story docs, architecture docs, and
> design docs via agentic coding tools (Claude Code, etc). This file describes
> the _why_, _what_, and _how_ of the project. Treat it as the spec to expand
> from, not a final architecture — later docs should refine and formalize what's
> here, not contradict it without a documented reason.
>
> **Merged from:** `Project Vision And Details.md` + `LifeOS Recommendations.md`
> **Last updated:** 2026-07-21

---

## 1. Vision

A personal, local-first **life operating system** for a single user — not a
SaaS product, not multi-tenant, no auth, no cloud sync (initially). It exists
to counteract a specific, named set of problems in the owner's daily life and
give them a single always-on surface (external monitor) that shows what to do
right now and how they're trending over time.

**Core belief driving the design:** the system succeeds if it reduces friction
between "deciding to do the right thing" and "doing it." Every feature should
be judged against that bar. Features that add ceremony, require configuration,
or need the user to context-switch away from the dashboard are suspect.

**Product principle (protect as the project expands):**

> A feature should make the next right action easier, more visible, or more
> likely to happen. If a feature only adds tracking, setup, configuration, or
> dashboard noise, defer it.

---

## 2. Owner profile (design persona — there is only one user, ever)

- Software engineer, Bangladesh, remote job, works Sunday–Thursday, roughly
  9:30 AM–6:00 PM.
- Works from home.
- Home gym equipment available (dumbbells, barbells, pushup board, resistance bands, pullup bar), no gym
  membership — all workouts must be performable at home.
- Early-career; skill growth is a stated priority (DevOps, MERN, Go, AI/LLM
  orchestration, Pentesting, ML, etc).
- Named problems the system must address:
  - Procrastination and general laziness
  - Chronic lateness / poor time awareness
  - Inconsistent or absent work sessions
  - Not drinking enough water
  - Not walking / sedentary
  - Irregular sleep schedule
  - Poor nutrition awareness
- Hardware: MacBook Pro M1, 8GB/256GB, permanently docked to an external
  monitor. **The external monitor is the primary work display; the MacBook's
  built-in screen is secondary and is where LifeOS lives.** The owner has
  stated they barely glance at the secondary screen during the day — this is
  a critical design constraint (see §7.6 Notifications): anything
  time-sensitive cannot rely on the dashboard being visually noticed and must
  use sound/OS-level notification, not just an on-screen visual change.

Design implication: this is not a "wellness app" with generic advice. It's an
instrument panel for one specific person's stated failure modes. Copy, defaults,
and feature priority should reflect that (e.g., water/sleep/lateness get more
dashboard real estate than generic "productivity" features).

---

## 3. Architecture philosophy

**Explicitly chosen: light hexagonal (ports & adapters), not full DDD.**

Rationale (decided during initial design conversation, keep this reasoning
attached to the decision so future agents don't "fix" it back to heavier DDD):

- Full DDD tactical patterns (aggregates, domain events, CQRS, value-object
  wrapping of every primitive, repository generics) exist to manage complexity
  from multiple stakeholders, long-lived teams, and rich business rules. None
  of those forces are present here — there is one user and one developer.
- What _is_ worth keeping from DDD/hexagonal thinking: **separation of pure
  domain logic from I/O**, and **depending on interfaces (ports) rather than
  concrete infrastructure**. This buys cheap insurance (swap SQLite later, add
  a second frontend, unit-test business rules without a DB) without ongoing
  ceremony cost.
- Rule of thumb for contributors/agents: **add a heavier pattern only when
  there is demonstrated pain without it** (e.g., "this rule is now duplicated
  in three places," or "I can't test this without spinning up SQLite"). Do not
  pre-build abstractions speculatively.

### Per-module shape (the template every module follows)

```
modules/<name>/
  domain/            Plain TypeScript types + pure functions. No framework
                      imports. Fully unit-testable in isolation.
  application/        Use-case functions. Plain functions that take a port
                      (repository interface) as an explicit parameter, e.g.
                      createTask(repo: TaskRepository, input: NewTaskInput).
                      NOT classes with DI containers.
  ports/               TypeScript interfaces only (e.g. TaskRepository).
                      These are the seam between business logic and storage.
  adapters/sqlite/     Concrete implementation of each port using
                      better-sqlite3. This is the only layer allowed to
                      import the SQLite driver.
  api/                Express router. Translates HTTP <-> use-case calls.
                      Validates input (zod). Contains NO business logic —
                      if a route handler needs an `if`, ask whether that
                      belongs in application/ instead.
```

The **composition root** (`backend/src/index.ts`) is the only file that
imports concrete adapters and wires them to ports via constructor injection
(plain `new SqliteXRepository(db)`, no DI framework). Every other file in the
codebase should be reachable through an interface.

### Module ownership

Modules will naturally relate to one another, but avoid direct cross-module
table writes. Each module owns its writes and business rules:

- **Routine:** scheduled tasks and task statuses
- **Habits:** habit definitions and logs
- **Workout:** plans, sessions, and exercise performance
- **Skills:** learning resources and study logs
- **Finance:** accounts, categories, and transactions
- **News:** feed cache (no user data)
- **Notifications:** reminder configuration and delivery/fire state
- **Dashboard:** composed, read-only summaries across module ports

Use a module port or application function when one module needs another
module's data or behavior.

### Cross-module query composition

The Dashboard needs combined Routine, Habits, Workout, Skills, and Finance
information. Establish this rule:

> Modules own their writes and business rules. Dashboard owns read-only
> cross-module composition. Modules must not directly write to one another's
> tables.

Use two complementary patterns:

**Pattern A — Compose module read ports (default):** Each module exposes
focused, dashboard-oriented read methods through its existing port, and
Dashboard application code combines the results.

```ts
interface TaskRepository {
  getNowAndNext(now: Date): Promise<NowAndNext>;
  getTodayCompletion(date: LocalDate): Promise<TaskCompletionSummary>;
}

interface HabitRepository {
  getTodayProgress(date: LocalDate): Promise<HabitProgress[]>;
}

interface WorkoutRepository {
  getTodayStatus(date: LocalDate): Promise<WorkoutStatus | null>;
}

interface DashboardDependencies {
  tasks: TaskRepository;
  habits: HabitRepository;
  workouts: WorkoutRepository;
}

export async function getDashboardSummary(
  deps: DashboardDependencies,
  now: Date,
): Promise<DashboardSummary> {
  const date = toLocalDate(now);
  const [schedule, habits, workout] = await Promise.all([
    deps.tasks.getNowAndNext(now),
    deps.habits.getTodayProgress(date),
    deps.workouts.getTodayStatus(date),
  ]);

  return { now: schedule.now, next: schedule.next, habits, workout };
}
```

The composition root supplies the concrete repositories. This preserves
boundaries and makes the Dashboard application layer easy to unit-test with
fake ports.

**Pattern B — Dedicated Dashboard read-model port:** Use this only if a
dashboard projection needs complex joins, a large aggregate, or would otherwise
produce inefficient N+1 queries. Dashboard may own a read-only port and SQLite
adapter that reads across module tables:

```text
modules/dashboard/
  application/getDashboardSummary.ts
  ports/DashboardReadRepository.ts
  adapters/sqlite/SqliteDashboardReadRepository.ts
  api/dashboardRoutes.ts
```

```ts
interface DashboardReadRepository {
  getSummary(input: { now: Date; date: LocalDate }): Promise<DashboardSummary>;
}
```

This is an intentional read-model exception, not a bypass of module ownership:
it must be read-only, limited to Dashboard needs, and must never be used for
cross-module writes or business-rule shortcuts.

**Recommended policy:** start with Pattern A. Introduce Pattern B only when a
combined view becomes awkward or demonstrably inefficient. Cross-module updates
should use explicit application-level orchestration, never direct table writes.

### Enforce fundamental invariants in SQLite too

API validation is essential, but the database should prevent obvious data
corruption. Examples:

- `CHECK` constraints for valid statuses and enum-like values
- `CHECK (end_time > start_time)` if overnight tasks are unsupported
- `UNIQUE(habit_id, date)` if habits are stored as daily aggregates
- `UNIQUE(task_id, scheduled_for)` for reminder delivery deduplication
- Ensure SQLite foreign keys are enabled for every connection
- Add `ON DELETE CASCADE` intentionally for child data such as workout session
  entries

### Explicit non-goals (do not introduce these without a new decision record)

- No authentication / user accounts / multi-tenancy.
- No ORM (raw SQL via `better-sqlite3`).
- No domain event bus / pub-sub between modules.
- No CQRS.
- No microservices — single backend process, single SQLite file.
- No cloud sync in the initial phase (may become a _later_ phase — see
  Roadmap — but is not in scope now).

---

## 4. Tech stack

| Layer                   | Choice                                                  | Notes                                                                                                           |
| ----------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Backend runtime         | Node.js (TypeScript, ESM)                               | `tsx` for dev, `tsc` for build                                                                                  |
| Backend framework       | Express                                                 | Thin HTTP layer only                                                                                            |
| Validation              | Zod                                                     | At the API boundary only                                                                                        |
| Database                | SQLite via `better-sqlite3`                             | Single local file, WAL mode                                                                                     |
| Frontend build          | Vite                                                    | React + TypeScript template                                                                                     |
| Frontend framework      | React                                                   | Function components, hooks only                                                                                 |
| Styling                 | Tailwind CSS v4                                         | Dark theme by default (always-on monitor use)                                                                   |
| Charts (planned)        | Recharts or Chart.js                                    | Not yet integrated — defer until a specific useful chart is known                                               |
| Realtime push (planned) | Server-Sent Events (`EventSource`, plain Express route) | For reminders only — one-directional server→client. Not WebSockets/socket.io; see §7.6                          |
| Testing                 | Vitest                                                  | Natural fit given Vite/TS stack; see §11                                                                        |
| Deployment target       | Local machine only (macOS, M1)                          | Optionally wrapped later in Tauri/Electron for a native always-on window; currently a browser tab is sufficient |

No cloud infra, no CI/CD requirement, no containerization requirement at this
stage — optimize for "runs with `npm run dev` on one Mac."

### Future technology decisions

#### Shared API types

Hand-synced frontend/backend types are acceptable while the app is small. When
duplicated contracts become error-prone, introduce a minimal workspace package:

```text
packages/contracts/
```

Share API DTOs, enums, and request/response contracts — not necessarily all
backend domain internals.

#### Native application shell

If LifeOS becomes daily-critical, a **Tauri** wrapper is likely a valuable
future step. It can improve always-on behavior, application launching, system
integrations, and notifications. It should remain deferred until browser
limitations are demonstrated in daily use.

#### Charts

Do not install a chart library until a specific useful chart is known. Early
value will more likely come from simple totals, consistency strips, and concise
trends than rich analytics dashboards.

---

## 5. Repository layout

```
lifeos/
  backend/
    src/
      modules/
        routine/
          domain/types.ts
          application/taskUseCases.ts
          ports/TaskRepository.ts
          adapters/sqlite/SqliteTaskRepository.ts
          api/routineRoutes.ts
        dashboard/
          application/getNowAndNext.ts
          application/getDashboardSummary.ts
          ports/DashboardReadRepository.ts       (if Pattern B needed)
          adapters/sqlite/SqliteDashboardReadRepository.ts
          api/dashboardRoutes.ts
        <future: workout/, finance/, skills/, habits/, news/, notifications/>
      shared/
        db.ts              SQLite connection + schema bootstrap
        migrations/        Versioned SQL migration files
          001_initial_tasks.sql
          002_add_task_reminders.sql
          003_create_habits.sql
          ...
      index.ts              Composition root + Express app + server start
    package.json
    tsconfig.json
    data/lifeos.sqlite       (gitignored — local data file)
  frontend/
    src/
      lib/api.ts             Typed fetch client for backend API
      modules/
        routine/
          useTodaySchedule.ts
          DayTimeline.tsx
          QuickAddTask.tsx
        dashboard/
          NowCard.tsx
          WeeklyReview.tsx
        <future: workout/, finance/, skills/, habits/, news/>
      App.tsx                 Dashboard shell / layout
      main.tsx
      index.css                Tailwind entrypoint
    package.json
  packages/
    contracts/               Shared TypeScript types (API DTOs, enums)
      index.ts
      routine.ts
      habits.ts
      ...
  README.md
  PROJECT.md                   (this file)
```

Convention: **frontend module folders mirror backend module names 1:1.**
When adding a backend module, add the matching frontend module folder in the
same change.

---

## 6. Designed modules (specs complete, not yet built)

### 6.1 Routine (task scheduler)

**Purpose:** structured day planner — the Structured-app-style feature. Every
task has a hard start and end time (not just a todo without time).

**Domain model** (`domain/types.ts`):

```ts
type TaskCategory =
  "work" | "workout" | "learning" | "habit" | "personal" | "general";
type TaskStatus = "planned" | "in_progress" | "done" | "skipped";

interface Task {
  id: string; // uuid
  title: string;
  category: TaskCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm, 24h
  endTime: string; // HH:mm, 24h
  status: TaskStatus;
  notes?: string;
  reminderMinutesBefore?: number; // null = no reminder
  reminderSound: boolean; // default true
  createdAt: string;
  updatedAt: string;
}
```

**Domain rules (pure functions, unit-testable):**

- `durationMinutes(task)` — computed from start/end.
- `tasksOverlap(a, b)` — true if same date and time ranges intersect.

**Application use cases:**

- `createTask(repo, input)` — validates `startTime < endTime`, creates the
  task, then returns `{ task, overlapsWith }` — overlap is **surfaced as a
  warning, not blocked**. Rationale: real days are messy; a hard block fights
  against how the tool will actually be used.
- `getDaySchedule(repo, date)`
- `setTaskStatus(repo, id, status)`
- `updateTask(repo, id, patch)`
- `deleteTask(repo, id)`

**API (`/api/routine`):**

| Method | Path                     | Body / Query             | Response                                     |
| ------ | ------------------------ | ------------------------ | -------------------------------------------- |
| GET    | `/tasks?date=YYYY-MM-DD` | —                        | `Task[]`                                     |
| POST   | `/tasks`                 | `NewTaskInput`           | `{ task: Task, overlapsWith: Task[] }` (201) |
| PATCH  | `/tasks/:id`             | `Partial<NewTaskInput>`  | `Task`                                       |
| PATCH  | `/tasks/:id/status`      | `{ status: TaskStatus }` | `Task`                                       |
| DELETE | `/tasks/:id`             | —                        | 204                                          |

**Storage:** table `tasks` (see §9 Data Model).

### 6.2 Dashboard (read-model / composition layer)

**Purpose:** the always-on glanceable view. Not a module with its own storage
— it's a read-model that composes other modules' ports. This is the intended
pattern for dashboard-wide aggregation: **dashboard depends on other modules'
ports, never on their adapters, and owns no persistence of its own.**

**Application logic:**

- `getNowAndNext(taskRepo, nowIso)` → `{ now, next, todayCount, todayDoneCount }`
  - `now`: the task whose time range contains the current time, or `null`.
  - `next`: the earliest task starting after now, or `null`.
- `getDashboardSummary(deps, now)` → aggregates Now/Next + habit progress +
  workout status (see §3 Cross-module query composition for full pattern).

**API (`/api/dashboard`):**

| Method | Path       | Response           |
| ------ | ---------- | ------------------ |
| GET    | `/summary` | `DashboardSummary` |

**Frontend behavior:** `NowCard` renders a live countdown (client-side
1-second tick against `now.endTime`); `App.tsx` polls `/summary` and
`routine/tasks` every 30 seconds. Polling, not websockets — deliberate
simplicity for a single local user.

**Frontend optimization:** pause background polling while the browser document
is hidden (`visibilitychange` event), then refresh when it becomes visible.
This is not necessary for scale but is clean and inexpensive.

---

## 7. Planned modules (not yet built — specs to guide agentic build-out)

Each should follow the exact module template in §3. Suggested build order and
why, per the product conversation that produced this project:

### 7.1 Habits (recommended next)

**Why first:** cheapest to build, highest daily leverage against the owner's
named problems (water, sleep timing, reading, lateness reinforcement).

Suggested domain shape:

```ts
type HabitId = string;
interface HabitDefinition {
  id: HabitId;
  name: string; // "Drink water", "Sleep by 11pm", "Read"
  targetPerDay: number; // e.g. 8 (glasses), 1 (boolean-ish habits use 1)
  unit: "count" | "boolean" | "minutes";
}
interface HabitLog {
  id: string;
  habitId: HabitId;
  date: string; // YYYY-MM-DD
  value: number; // count/minutes logged, or 1/0 for boolean
  loggedAt: string; // timestamp
}
```

Needed use cases: define habit, log a check-in (increment or set), get today's
progress per habit, get streak/consistency over N days. Dashboard widget:
quick-tap chips for each habit (e.g. "+1 glass of water") plus a weekly
consistency strip.

### 7.2 Workout (full planner + home coach)

**Why second:** directly addresses a named goal (fitness) and pairs naturally
with the Routine module (a workout is just a specially-typed task with
structured sub-steps).

Suggested domain shape:

```ts
interface Exercise {
  id: string;
  name: string;
  equipment: "bodyweight" | "dumbbell" | "other";
  videoUrl?: string; // reference/how-to link
  defaultSets?: number;
  defaultReps?: number;
}
interface WorkoutPlan {
  id: string;
  name: string; // "Push Day", "Full Body A"
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    restSeconds: number;
  }[];
}
interface WorkoutSession {
  id: string;
  planId: string;
  date: string;
  startedAt?: string;
  completedAt?: string;
  entries: {
    exerciseId: string;
    setsCompleted: number;
    repsCompleted: number;
    weightKg?: number;
  }[];
}
```

Needed features: plan builder, session "coach mode" (per-exercise timer,
video reference, rest timer, next-exercise auto-advance), history/progress
view (weight/reps trend per exercise over time). Equipment constraint:
dumbbells up to ~13.5 kg — plan builder should not need to enforce this, but
seed/reference data should stay realistic to home-equipment.

### 7.3 Skills (learning tracker)

Suggested domain shape:

```ts
interface SkillArea {
  id: string;
  name: string;
} // "Go", "DevOps", "AI/LLM"
interface LearningResource {
  id: string;
  skillAreaId: string;
  title: string;
  type: "course" | "book" | "project" | "article";
  totalUnits?: number;
  unit?: "chapters" | "videos" | "hours";
}
interface LearningLog {
  id: string;
  resourceId: string;
  date: string;
  minutesSpent: number;
  unitsCompleted?: number;
  notes?: string;
}
```

Needed features: log a study session (time + optional progress against a
course's total units), see weekly/monthly time-by-skill-area breakdown,
course completion % for in-progress resources.

### 7.4 Finance (manual ledger)

Explicitly **no bank integration, no Plaid, fully manual** — matches the
stated Money Pro-style requirement.

```ts
interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "card" | "savings";
}
interface Category {
  id: string;
  name: string;
  kind: "income" | "expense";
}
interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  date: string;
  amountMinor: number; // e.g. 12550 represents ৳125.50 — integer minor units, NOT REAL
  currency: "BDT";
  note?: string;
}
```

**Important: use integer minor units for money, not `REAL`.** Binary
floating-point values create precision errors. Integer minor units are simpler
for a personal ledger.

Needed features: monthly income/expense summary, category breakdown, running
balance per account, simple budget-vs-actual per category (optional/later).

**Accounting decisions to resolve before Phase 4 implementation:**

- Is an account transfer represented as two linked entries?
- How are credit-card payments represented?
- Are starting balances stored as account metadata or opening-balance
  transactions?
- Can categories be archived without breaking historical reports?
- Can transactions be edited or deleted after they affect a previous month's
  totals?

Finance data requires stronger validation and more careful modeling than most
other modules because users must be able to trust the historical numbers.

### 7.5 News (lowest priority)

RSS-based, no accounts. Fetch a small fixed set of feeds server-side, cache
in SQLite, surface a condensed "catch-up" list on the dashboard. No
personalization/ML needed for v1 — a static curated feed list is fine to
start.

**Data management rules:**

- Deduplicate by feed GUID or canonical link.
- Retain only a bounded number of old items (e.g. last 200 per feed).
- Fetch feeds conservatively (every 30 minutes max).
- Keep News low priority so it does not become another distraction source.

### 7.6 Notifications (reminders) — promoted from "open question" to a real module

**Why this exists:** the owner explicitly needs pre-task reminders (example
given: a Google Meet call, needs a nudge 5 minutes before to prepare). Given
the owner rarely looks at the MacBook's built-in screen (where LifeOS lives —
see §2), a silent/visual-only reminder is not sufficient. **Sound is
required, not optional.**

**Delivery mechanism — Server-Sent Events (SSE), not WebSockets or plain polling:**

- Plain 30s polling (used elsewhere in the app) is too imprecise for a
  "5 minutes before" reminder — it could fire anywhere within the poll
  window, up to ~30s late/early, and adds needless delay for something
  time-critical.
- A full bidirectional WebSocket (e.g. socket.io) is unnecessary complexity —
  the client never needs to send real-time data back to the server for this
  feature. **SSE (`EventSource`) is the right tool**: one-directional
  server→client push, plain HTTP under the hood, automatic reconnect built
  into the browser API, no extra server dependency.
- Decision recorded here so an agentic build pass does not default to
  installing `socket.io` — use SSE via a plain Express route that keeps the
  response open (`Content-Type: text/event-stream`).

**Known hard limitation (must not be silently designed around):** this only
works while the backend process is running, the browser tab is open, and the
Mac is awake. There is no reminder if the laptop is asleep or the app is
fully closed — that would require a native macOS app or a push service,
which is out of scope for the current local-only architecture. State this
limitation in the UI (e.g. a small "notifications active" indicator) rather
than letting the owner assume it's more reliable than it is.

**Domain model:**

```ts
interface ReminderConfig {
  taskId: string;
  minutesBefore: number; // default 5
  sound: boolean; // default true — sound is the primary channel, not a nice-to-have
}
interface ReminderFire {
  id: string;
  taskId: string;
  scheduledFor: string; // computed: task.startTime - minutesBefore
  firedAt: string | null; // null until actually sent, prevents duplicate firing
}
```

Suggested schema:

```sql
-- Added to tasks table via migration
ALTER TABLE tasks ADD COLUMN reminder_minutes_before INTEGER;  -- NULL = no reminder
ALTER TABLE tasks ADD COLUMN reminder_sound INTEGER NOT NULL DEFAULT 1; -- boolean 0/1

CREATE TABLE reminder_fires (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  scheduled_for TEXT NOT NULL,   -- ISO timestamp
  fired_at TEXT                  -- NULL until fired; set once to prevent duplicate sends
);

-- Prevent duplicate reminder delivery at the database level
CREATE UNIQUE INDEX idx_reminder_fires_task_scheduled
ON reminder_fires(task_id, scheduled_for);
```

**Backend components:**

- `modules/notifications/application/reminderScheduler.ts` — a lightweight
  interval (~every 15–20s) that queries tasks with a `reminder_minutes_before`
  set, computes whether `now >= task.startTime - reminder_minutes_before` and
  no `reminder_fires` row exists yet for that task, and if so inserts a
  `reminder_fires` row and pushes an SSE event. This is a plain scheduled
  function in the composition root (`setInterval`), not a job queue —
  unnecessary infra for this scale. Insert the reminder fire record
  **atomically before** publishing the SSE event to prevent duplicate delivery
  after restarts or scheduler races.
- `modules/notifications/api/notificationRoutes.ts` — exposes
  `GET /api/notifications/stream` (SSE endpoint the frontend subscribes to
  once, on load) and a `PATCH /api/routine/tasks/:id/reminder` route (or
  folded into the existing task PATCH route) to set `minutesBefore`/`sound`
  per task.

**Frontend components:**

- A single `EventSource` connection opened once in `App.tsx` (or a
  `useNotificationStream` hook), listening for `reminder` events.
- On receipt: play a short alert sound (an actual audio file, not just a
  system beep — should be distinct enough to notice from another room) and
  fire a browser `Notification` (macOS will surface this as a native
  notification banner, which helps even though the tab itself isn't watched).
- Reminder toggle + minutes-before field added to `QuickAddTask` and to each
  task row in `DayTimeline` (small bell icon, editable inline).

**Required UX states — show a clear indicator for:**

- `Notifications active`
- `Notifications unavailable: backend disconnected`
- `Browser notification permission required`
- `Sound needs to be enabled`

**Browser notification permission:** request from a deliberate user action
(such as an "Enable reminders" button) — not automatically on first page
render.

**Browser audio restrictions:** browsers may block audio before a user
interacts with the page. Provide a **Test reminder sound** action and ensure
the user interaction enables later audio playback.

**Recurring tasks** will eventually be useful for work blocks, workouts, sleep
preparation, and repeated habits. Do not add recurrence until one-off task
creation and reminders are polished; recurrence introduces meaningful edge
cases around skipped instances, edits, timezone changes, and exceptions.

**Explicit non-goals for v1:** no per-reminder custom sound selection, no
snooze, no reminder history/log view. Add only if the basic version proves
insufficient in daily use.

### 7.7 Weekly review (dashboard widget)

**Why this exists:** tracking alone does not improve behavior. A concise
weekly review closes the feedback loop between "what I planned" and "what
actually happened."

**Data shown:**

- Planned versus completed tasks (count + percentage)
- Missed, skipped, or late tasks
- Habit consistency per habit (days hit vs. days missed)
- Workout and study totals for the week
- One small reflection prompt:
  - What blocked me?
  - What should change next week?

Keep this minimal. It should improve the next week's defaults, not become a
journaling system.

**Implementation:** a dashboard widget (`WeeklyReview.tsx`), not a separate
module. The data is computed from existing Routine, Habits, Workout, and
Skills ports. No new persistence needed.

**Placement in roadmap:** add after Habits (Phase 1) and before Workout
(Phase 2), as it relies on habit data being available.

---

## 8. Frontend design principles

- **Dark theme by default** — designed for a monitor that's on all day in a
  home office, not a phone glanced at outdoors.
- **Dashboard-first**: `App.tsx` is the permanent home screen. Module-specific
  deep screens (workout coach mode, finance ledger, skill detail) are
  secondary views, not the default landing experience.
- **Now/Next pattern**: the dashboard's job is to answer "what should I be
  doing, right now, and for how long" before anything else. This card sits at
  the top-left, largest visual weight.
- **Low-friction logging**: habit check-ins, task status changes, and workout
  set completion should be one click/tap — no multi-step modals for routine
  actions.
- **Polling over websockets for general data refresh**: acceptable and
  preferred for this scale (single user, single device most of the time) —
  used for task list / dashboard summary refresh (~30s interval).
  **Exception: reminders/notifications use SSE** (see §7.6) since precise
  timing matters there in a way it doesn't for general UI refresh. Do not
  install a full WebSocket library (e.g. socket.io) for either case.
- **Pause polling when hidden**: stop background polling while the browser
  document is hidden (`visibilitychange` event), then refresh when it becomes
  visible. Clean and inexpensive.
- **No component library dependency beyond Tailwind utility classes** at this
  stage — keep the design system homegrown and simple until a real need for
  consistency across many screens emerges.

---

## 9. Data model (all planned — single SQLite file)

> No tables exist yet. Everything below is a draft to refine when each module
> is actually built.

```sql
-- Migration version tracking
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Routine (Phase 0)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('work', 'workout', 'learning', 'habit', 'personal', 'general')),
  date TEXT NOT NULL,          -- YYYY-MM-DD
  start_time TEXT NOT NULL,     -- HH:mm
  end_time TEXT NOT NULL,       -- HH:mm
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'done', 'skipped')),
  notes TEXT,
  reminder_minutes_before INTEGER,  -- NULL = no reminder
  reminder_sound INTEGER NOT NULL DEFAULT 1, -- boolean 0/1
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (end_time > start_time)
);
CREATE INDEX idx_tasks_date ON tasks(date);

-- Habits (Phase 1)
CREATE TABLE habit_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_per_day REAL NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('count', 'boolean', 'minutes'))
);
CREATE TABLE habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habit_definitions(id),
  date TEXT NOT NULL,
  value REAL NOT NULL,
  logged_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(habit_id, date)
);

-- Workout
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  equipment TEXT NOT NULL CHECK (equipment IN ('bodyweight', 'dumbbell', 'other')),
  video_url TEXT,
  default_sets INTEGER,
  default_reps INTEGER
);
CREATE TABLE workout_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE workout_plan_exercises (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rest_seconds INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);
CREATE TABLE workout_sessions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES workout_plans(id),
  date TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);
CREATE TABLE workout_session_entries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_kg REAL
);

-- Skills
CREATE TABLE skill_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE learning_resources (
  id TEXT PRIMARY KEY,
  skill_area_id TEXT NOT NULL REFERENCES skill_areas(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'book', 'project', 'article')),
  total_units REAL,
  unit TEXT CHECK (unit IN ('chapters', 'videos', 'hours'))
);
CREATE TABLE learning_logs (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL REFERENCES learning_resources(id),
  date TEXT NOT NULL,
  minutes_spent INTEGER NOT NULL,
  units_completed REAL,
  notes TEXT
);

-- Finance (integer minor units for precision)
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'card', 'savings'))
);
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense'))
);
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  date TEXT NOT NULL,
  amount_minor INTEGER NOT NULL, -- e.g. 12550 = ৳125.50
  currency TEXT NOT NULL DEFAULT 'BDT',
  note TEXT
);

-- News (cache only, no user data)
CREATE TABLE news_feeds (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  label TEXT NOT NULL
);
CREATE TABLE news_items (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES news_feeds(id),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  published_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reminder fires (from §7.6)
CREATE TABLE reminder_fires (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  scheduled_for TEXT NOT NULL,
  fired_at TEXT
);
CREATE UNIQUE INDEX idx_reminder_fires_task_scheduled
ON reminder_fires(task_id, scheduled_for);
```

### Query-aligned indexes

Add these as each module is built:

```sql
CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX idx_learning_logs_resource_date ON learning_logs(resource_id, date);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date);
CREATE INDEX idx_transactions_category_date ON transactions(category_id, date);
CREATE INDEX idx_workout_sessions_plan_date ON workout_sessions(plan_id, date);
CREATE INDEX idx_news_items_feed_published ON news_items(feed_id, published_at);
```

### Migration approach

Use a simple versioned SQL migration mechanism instead of `CREATE TABLE IF NOT
 EXISTS`:

```text
backend/src/shared/migrations/
  001_initial_tasks.sql
  002_add_task_reminders.sql
  003_create_habits.sql
  ...
```

Maintain a `schema_migrations` table recording applied migrations. This makes
destructive changes, backfills, constraints, and schema corrections safe and
auditable. Use SQLite's backup mechanism or a consistent checkpoint/backup
workflow when running migrations on a database with existing data.

Foreign key cascades: add `ON DELETE CASCADE` intentionally for child tables
(workout session entries, workout plan exercises). Decide per-module when
building.

---

## 10. Non-functional requirements

- **Zero external accounts required to run the app** (no OAuth, no signup) —
  a fresh clone + `npm install` + `npm run dev` on both folders must be
  sufficient to get a working system.
- **Data durability**: SQLite file must be easy to locate and back up
  (`backend/data/lifeos.sqlite`); no requirement for automated backups yet,
  but the design should not make manual backup hard (single file, not a
  directory of shards). Implement an in-app backup/export action with
  timestamped backups and clear restore instructions **before Phase 4
  (Finance)** — finance data must be trustworthy.
- **Performance**: trivial at this scale (single user, low request volume) —
  do not over-engineer for concurrency or query optimization. See §12 for
  practical optimizations.
- **Testing**: domain layer (`domain/`) and application layer
  (`application/`) should be unit-testable without a database — this is the
  main payoff of the ports pattern and should be exercised as modules are
  added. Use **Vitest** for backend domain/application tests.
- **Type safety**: `strict: true` TypeScript on the backend; frontend API
  client types should stay hand-synced with backend types via
  `packages/contracts` once duplication becomes error-prone.
- **Timezone**: the app's configured timezone is `Asia/Dhaka`. Tasks use
  local date/time fields for schedule UX. Reminder calculations derive
  timezone-aware timestamps. Overnight tasks are not supported in v1. If the
  user travels, the system does not adjust — this is a known limitation.
- **Loopback binding**: bind Express to `127.0.0.1` (not `0.0.0.0`). Restrict
  CORS to the intended local frontend origin during development. This reduces
  the risk that another device on the same network can call the unauthenticated
  API.

---

## 11. Testing strategy

### Recommended baseline

- Use **Vitest** for backend domain/application tests.
- Test SQLite repositories and API validation with integration tests.
- Add a small number of Playwright end-to-end flows later.

### Highest-value unit tests

- Task duration and overlap edge cases
- Task create/update validation
- Now/Next calculation
- Habit streak and consistency calculations
- Reminder due-time and deduplication logic
- Workout summary/progress calculations
- Finance totals and account-balance calculations

### Later end-to-end flows

- Create, update, and complete a task
- Quick-log a habit
- Enable and test a reminder
- Log a workout session
- Add a finance transaction and verify a monthly total

Prioritize tests for dates, times, streaks, reminder idempotency, and money
calculations over visual component snapshots.

---

## 12. Roadmap / phases

**Phase 0:** Routine module + Dashboard now/next view, full-stack
skeleton proven end-to-end. Versioned migrations in place.

**Phase 1:** Habits module (dashboard-integrated quick-log chips + streaks).
Vitest installed. Weekly review widget added.

**Phase 1.5 (insert after Habits, before Workout — owner-requested,
time-sensitive):** Notifications module (§7.6) — per-task reminders with
sound via SSE. Placed early because it directly addresses the
lateness/meeting-prep problem named in §2, and because Workout's "coach
mode" timers will likely reuse the same sound-alert plumbing.

**Phase 2:** Workout module (planner + coach mode with timers + video refs +
history).

**Phase 3:** Skills module (learning session logging + course progress).
In-app backup/export implemented before valuable history accumulates.

**Phase 4:** Finance module (manual ledger + monthly views). Accounting
decisions resolved. Integer minor units for money.

**Phase 5:** News module (RSS aggregation, dashboard ticker/digest).

**Phase 6 (stretch, not committed):** polish pass — charts library
integration (weekly consistency charts, workout progress graphs, finance
trend lines), possible native shell (Tauri) for a true always-on app window
instead of a browser tab, possible read-only mobile companion view.

Each phase should ship as: backend module (domain → application → ports →
sqlite adapter → api routes) fully wired into the composition root, matching
frontend module, and a dashboard widget surfacing its most glanceable metric.

### Feature priority rationale

Routine, Habits, and Notifications should prove the core daily loop before
advanced modules receive significant effort. The core loop is:

1. Plan the day.
2. See what is happening now and next.
3. Receive an effective reminder.
4. Record what actually happened.
5. Use a short review to improve the next week.

### Features worth delaying

- Advanced budgeting and financial forecasting
- Sophisticated workout-program generation
- Many charts and dashboards
- RSS personalization
- Complex recurrence rules
- Mobile sync

---

## 13. Data durability, privacy, and local security

### Backups should be prioritized before sync

The single SQLite file is portable and simple, but it is still a single point
of failure. Before Finance or other valuable long-term records are added,
implement:

- An in-app backup/export action
- Timestamped backups
- Clear restore instructions
- A verified restore test
- Optional encrypted backup storage later

When SQLite uses WAL mode, do not blindly copy only the `.sqlite` file while
the process is writing. Use SQLite's backup mechanism or a consistent
checkpoint/backup workflow.

### Bind the local backend to loopback only

No authentication is appropriate for the stated local-only model, but the
server should not unintentionally be reachable from the local network.

Bind Express to `127.0.0.1`. Also restrict CORS to the intended local frontend
origin during development. This reduces the risk that another device on the
same network can call the unauthenticated API.

---

## 14. Performance and optimization

### Existing good choices

- Local SQLite eliminates network latency.
- `better-sqlite3` is fast for small local workloads.
- 30-second dashboard polling is reasonable.
- The live Now-card countdown is client-side.
- SSE avoids unnecessary WebSocket infrastructure for reminders.

### Practical optimizations

Only implement these when corresponding modules and queries exist:

- **Add query-aligned indexes** — see §9 for the full list.
- **Return summaries, not complete histories** — dashboard endpoints should
  return only data required by dashboard widgets. Avoid loading a full
  history to compute a single current-day summary.
- **Use SQLite transactions for related writes** — e.g. creating a workout
  session and its entries, recording a finance transfer's linked entries,
  creating a `reminder_fires` record before notification delivery.
- **Bound RSS data** — deduplicate by feed GUID, retain only a bounded number
  of old items, fetch feeds conservatively.
- **Pause unnecessary polling when hidden** — stop background polling while
  the browser document is hidden, then refresh when it becomes visible.

---

## 15. Open questions / decisions deferred

These are flagged, not resolved — an agentic coding pass should ask or make a
documented decision rather than silently picking one:

1. ~~**Shared types between frontend/backend**~~ — **Resolved.** Introduce a
   `packages/contracts` workspace when duplicated types become error-prone.
   Share API DTOs and request/response contracts, not all backend domain
   internals.
2. ~~**Testing framework**~~ — **Resolved.** Vitest, given the existing
   Vite/TS stack.
3. **Native app shell** — currently a plain browser tab pinned to the external
   monitor. Electron/Tauri wrapper is a possible Phase 6 item, not required.
   Defer until browser limitations are demonstrated in daily use.
4. **Cloud backup / sync** — explicitly out of scope for now; revisit only if
   a second device (e.g. phone) needs to read/write the same data.
5. ~~**Migration tooling**~~ — **Resolved.** Use simple versioned SQL migration
   files in `backend/src/shared/migrations/` with a `schema_migrations`
   tracking table. Adopted now, before valuable history exists.
6. ~~**Notifications**~~ — **Resolved.** Owner confirmed this is needed
   (example: meeting-prep reminders). Spec'd in §7.6 and scheduled as Phase
   1.5. Decision: SSE, not WebSockets/socket.io, and sound is mandatory (not
   just a visual toast) because LifeOS runs on the secondary screen the owner
   rarely looks at directly.
7. **Finance accounting decisions** — deferred to a decision record when
   Phase 4 begins. See §7.4 for the list of unresolved questions.

---

## 16. Glossary

- **Port** — a TypeScript interface defining what a module needs from
  storage (e.g. `TaskRepository`). Application code depends on ports, never
  on adapters directly.
- **Adapter** — a concrete implementation of a port (currently always SQLite
  in this project).
- **Composition root** — the single file (`backend/src/index.ts`) where
  adapters are instantiated and wired to the modules that need them.
- **Use case** — a plain function in a module's `application/` folder
  representing one thing the system can be asked to do (e.g. `createTask`).
- **Now/Next** — the dashboard's core read-model: the task happening at this
  exact moment, and the task coming up after it.
- **SSE (Server-Sent Events)** — one-directional server→client push over
  plain HTTP, used only for the Notifications module (§7.6). Chosen over
  WebSockets because the client never needs to send real-time data back.
- **Integer minor units** — storing monetary amounts as integers (e.g. 12550
  = ৳125.50) to avoid floating-point precision errors. Used in the Finance
  module.

---

## Appendix A: Engineering review log

> This appendix preserves the original `LifeOS Recommendations.md` for
> traceability. All actionable items from this review have been merged into the
> main spec above. This section exists so future contributors can see the full
> reasoning behind each recommendation.

### Executive assessment

LifeOS is a **highly feasible** personal software project. Its strongest
quality is that it is designed for one concrete person and a small set of
concrete behavior problems — not as a generic productivity SaaS.

The core product principle is excellent:

> Reduce friction between deciding to do the right thing and actually doing it.

The architecture and technology choices are well matched to the constraints:
one user, one Mac, local use, low data volume, no cloud dependency, and an
always-on dashboard. The principal risks are not database throughput or
infrastructure; they are **scope growth, data evolution, reminder reliability
expectations, and maintaining enough daily value that manual logging remains
worthwhile**.

**Overall assessment: 8/10 as a product and technical plan.**

### 1. Project feasibility

#### Technical feasibility

All currently planned modules are practical with the proposed stack. These are
conventional local CRUD, scheduling, and reporting features. A single Express
process and SQLite database can support them comfortably for years of personal
use.

#### Product feasibility

The more difficult problem is sustained use, not implementation. Personal
dashboards fail when they require excessive manual entry, configuration, or
attention. The specification makes several correct countermeasures:

- Dashboard-first UX
- Prominent **Now / Next** information
- Low-friction, one-click logging
- Defaults based on the owner's real routine and failure modes
- Avoidance of unnecessary setup and generic wellness features

#### Main feasibility risk: scope before validation

The project can become a collection of trackers without improving daily action.
Before expanding broadly, validate this core loop:

1. Plan the day.
2. See what is happening now and next.
3. Receive an effective reminder.
4. Record what actually happened.
5. Use a short review to improve the next week.

Routine, Habits, and Notifications should prove this loop before advanced
modules receive significant effort.

### 2. Architecture assessment

#### What is strong

The proposed light hexagonal / ports-and-adapters approach is appropriate. It
preserves the useful parts of architectural separation without introducing
enterprise-style ceremony.

Strong decisions include:

- Pure domain logic can be unit-tested without a database.
- Application functions receive dependencies explicitly.
- SQLite access remains in adapters.
- Express routes are thin translation/validation layers.
- The dashboard is a composition/read model, not a persistence-heavy module.
- The composition root is explicit and easy to understand.
- Frontend and backend module names mirror one another.

#### Recommendations applied

- **Introduce simple versioned migrations early** — merged into §3 and §9.
- **Keep module ownership clear** — merged into §3.
- **Define cross-module query composition explicitly** — merged into §3 with
  both Pattern A (compose module read ports) and Pattern B (dedicated
  Dashboard read-model port).
- **Treat dates, times, and timezone as a real domain decision** — merged
  into §10 (timezone: `Asia/Dhaka`).
- **Enforce fundamental invariants in SQLite too** — merged into §3 and §9
  (CHECK constraints, UNIQUE indexes, foreign key cascades).

### 3. Technology stack assessment

All technology choices are appropriate and well-matched to the project's
constraints. The stack is deliberately conventional — that is a strength.

Future decisions resolved:

- **Shared API types** → `packages/contracts` workspace (see §4 and §5).
- **Native application shell** → deferred to Phase 6 (see §4).
- **Charts** → defer until a specific useful chart is known (see §4).

### 4. Scalability

SQLite with WAL mode can comfortably support years of personal data. The
system's practical limit will be product complexity and attention, not database
capacity.

Deliberate non-scalability boundaries (acceptable exclusions):

- Multiple concurrent users
- General remote access
- Reliable cross-device synchronization
- Push notifications to a phone
- High availability
- Team collaboration
- Background reminders while the Mac is asleep or shut down

### 5. Performance and optimization

All practical optimizations have been merged into §14. Key points:

- Add query-aligned indexes as modules are built.
- Return summaries, not complete histories.
- Use SQLite transactions for related writes.
- Bound RSS data retention.
- Pause polling when the browser tab is hidden.

### 6. Feature and roadmap recommendations

Merged into §12. Key additions:

- Weekly review widget (§7.7) added after Habits.
- Backup required before Phase 4.
- Validation-first emphasis: prove the core loop before expanding.

### 7. Reminder and notification recommendations

Merged into §7.6. Key additions:

- Required UX states (4 states documented).
- Browser notification permission flow (deliberate user action, not auto).
- Browser audio restrictions and test sound action.
- Unique index for duplicate prevention.
- Recurring tasks deferred until basics are polished.
- Native shell as long-term reliability upgrade.

### 8. Finance module recommendations

Merged into §7.4 and §9. Key changes:

- `amountMinor INTEGER` instead of `amount REAL`.
- `currency TEXT NOT NULL DEFAULT 'BDT'`.
- Five accounting questions flagged for Phase 4 decision.

### 9. Testing and quality strategy

Merged into §11. Key decisions:

- Vitest for backend domain/application tests.
- Integration tests for SQLite repositories.
- Playwright for later E2E flows.
- Priority: dates, times, streaks, reminder idempotency, money calculations.

### 10. Data durability, privacy, and local security

Merged into §13. Key requirements:

- In-app backup/export before Phase 4.
- Timestamped backups with verified restore test.
- Loopback binding (`127.0.0.1`).
- CORS restriction to local frontend origin.

### Final product principle

> A feature should make the next right action easier, more visible, or more
> likely to happen. If a feature only adds tracking, setup, configuration, or
> dashboard noise, defer it. The strength of LifeOS is its specificity and its
> willingness to remain small enough to be useful.

This principle has been added to §1 Vision.
