## Context

LifeOS is a single-user local-first life management app. Phase 0 must prove the hexagonal architecture works end-to-end. The project-shell scaffold is already in place (pnpm monorepo, better-sqlite3, Vite frontend, Biome, shared contracts). No business modules exist yet.

The Routine module is a structured day planner where every task has a hard start and end time. The Dashboard is a read-only composition layer that shows what's happening now and what's next.

## Goals / Non-Goals

**Goals:**
- Prove the full module template (domain → application → ports → sqlite adapter → api) works end-to-end
- Validate SQLite migration versioning with the `schema_migrations` table
- Demonstrate cross-module read composition (Dashboard depends on Routine's port)
- Ship a functional day planner and now/next view

**Non-Goals:**
- Habits, Workout, or other modules (Phase 1+)
- WebSocket or push-based updates (polling is sufficient for single local user)
- Authentication or multi-user support
- Offline-first or sync capabilities
- Charts or analytics beyond the now/next card

## Decisions

### D1: Module structure follows the project-shell template exactly

Each module gets `domain/`, `application/`, `ports/`, `adapters/sqlite/`, `api/`. The composition root (`backend/src/index.ts`) wires concrete adapters to ports. No DI framework — plain constructor injection.

**Why**: Validates the architectural decision in §3 of the spec. If this pattern is painful with two modules, it will be worse with six.

### D2: Dashboard owns no storage — pure composition

Dashboard reads from Routine's `TaskRepository` port. It does not have its own database tables. `getNowAndNext` is a pure function that takes a task list and current time.

**Why**: Establishes the read-only composition pattern early. Prevents data duplication and keeps Dashboard lightweight.

### D3: Frontend polling at 30s with visibility API pause

The frontend polls `/api/dashboard/summary` and `/api/routine/tasks` every 30 seconds. Polling pauses when the document is hidden (`visibilitychange` event) and resumes when visible.

**Why**: Simple, predictable, no WebSocket infrastructure. The visibility pause avoids wasted network calls when the tab is backgrounded.

### D4: Overlap as warning, not block

`createTask` returns `{ task, overlapsWith: Task[] }`. Overlaps are surfaced to the user but not prevented.

**Why**: Real days are messy. A hard block fights against actual usage. The spec explicitly calls this out.

### D5: Shared types via `@lifeos/contracts`

Task and DashboardSummary types live in `packages/contracts/` and are imported by both backend and frontend.

**Why**: Type safety across the stack without duplication. Already the pattern established by project-shell.

## Risks / Trade-offs

- **Polling latency**: 30s means the now/next card could be stale for up to 30s. → Acceptable for v1; the live countdown on the current task masks this.
- **No persistent connections**: If the backend restarts, the frontend will get errors until the next poll. → The frontend should handle fetch errors gracefully and retry on next poll cycle.
- **Single SQLite writer**: All module writes go through one SQLite connection. → Fine for single-user; WAL mode handles concurrent reads.
