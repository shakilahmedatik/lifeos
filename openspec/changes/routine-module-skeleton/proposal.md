## Why

Phase 0 must prove the full-stack architecture works end-to-end with a real module. The Routine module (structured day planner) and Dashboard (glanceable now/next view) are the two modules that form the core daily loop: plan the day, see what's happening now and next. Building these first validates the hexagonal module template, SQLite adapter pattern, API routing, frontend polling, and composition root wiring — all before adding complexity from other modules.

## What Changes

- Add Routine module: domain types (`Task`, `TaskCategory`, `TaskStatus`), pure domain functions (`durationMinutes`, `tasksOverlap`), application use cases (`createTask`, `getDaySchedule`, `setTaskStatus`, `updateTask`, `deleteTask`), `TaskRepository` port, SQLite adapter, and Express API routes (`/api/routine`).
- Add Dashboard module: read-only composition layer with `getNowAndNext` logic, `DashboardDependencies` port, and `/api/dashboard/summary` endpoint.
- Add `tasks` table migration with proper indexes.
- Add frontend components: task list/day view, now/next card with live countdown, 30-second polling with visibility-change pause.
- Wire both modules into the composition root.

## Capabilities

### New Capabilities
- `routine`: Task scheduling — create, read, update, delete timed tasks for a day. Overlap detection as warning. Status tracking (planned, in_progress, done, skipped).
- `dashboard`: Read-only composition of module data into a glanceable summary. Now/next task identification with live countdown.

### Modified Capabilities
- `project-shell`: Requires adding the routine and dashboard module folder structures, migration files, and API route registration in the composition root.

## Impact

- `backend/src/modules/routine/` — new module (domain, application, ports, adapters, api)
- `backend/src/modules/dashboard/` — new module (application, ports, api)
- `backend/src/index.ts` — composition root wiring for both modules
- `backend/migrations/` — new migration for `tasks` table
- `packages/contracts/` — shared types for Task, DashboardSummary
- `frontend/src/` — new components for day view and dashboard cards
- Dependencies: better-sqlite3, zod (already in project-shell), no new external deps
