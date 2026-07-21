## 1. Routine Module — Domain Layer

- [x] 1.1 Create `backend/src/modules/routine/domain/types.ts` with `TaskCategory`, `TaskStatus`, and `Task` interfaces
- [x] 1.2 Create `backend/src/modules/routine/domain/rules.ts` with `durationMinutes` and `tasksOverlap` pure functions

## 2. Routine Module — Ports & Adapters

- [x] 2.1 Create `backend/src/modules/routine/ports/task-repository.ts` with `TaskRepository` interface (CRUD + `getByDate`)
- [x] 2.2 Create `backend/src/modules/routine/adapters/sqlite/sqlite-task-repository.ts` implementing `TaskRepository` with better-sqlite3

## 3. Routine Module — Application Layer

- [x] 3.1 Create `backend/src/modules/routine/application/use-cases.ts` with `createTask`, `getDaySchedule`, `setTaskStatus`, `updateTask`, `deleteTask`

## 4. Routine Module — API Layer

- [x] 4.1 Create `backend/src/modules/routine/api/router.ts` with Express routes: GET `/tasks`, POST `/tasks`, PATCH `/tasks/:id`, PATCH `/tasks/:id/status`, DELETE `/tasks/:id`
- [x] 4.2 Add zod validation schemas for all request bodies and query params

## 5. Database Migration

- [x] 5.1 Create migration file for `tasks` table with indexes, constraints, and CHECK clauses per spec §9

## 6. Dashboard Module

- [x] 6.1 Create `backend/src/modules/dashboard/ports/dashboard-dependencies.ts` with `DashboardDependencies` interface (depends on `TaskRepository`)
- [x] 6.2 Create `backend/src/modules/dashboard/application/summary.ts` with `getNowAndNext` and `getDashboardSummary` functions
- [x] 6.3 Create `backend/src/modules/dashboard/api/router.ts` with GET `/summary` endpoint

## 7. Composition Root & Wiring

- [x] 7.1 Register routine and dashboard routes in `backend/src/index.ts` composition root
- [x] 7.2 Wire `SqliteTaskRepository` to `TaskRepository` port via constructor injection

## 8. Shared Contracts

- [x] 8.1 Add `Task`, `NewTaskInput`, `DashboardSummary` types to `packages/contracts/`
- [x] 8.2 Export types from contracts package and ensure backend/frontend can import them

## 9. Frontend — Day View

- [x] 9.1 Create task list component showing all tasks for the selected day, ordered by start time
- [x] 9.2 Create task creation form with fields for title, category, date, start/end times, notes
- [x] 9.3 Create task status toggle (planned → in_progress → done/skipped)

## 10. Frontend — Dashboard

- [x] 10.1 Create `NowCard` component with live countdown to current task's end time (1s tick)
- [x] 10.2 Create `NextCard` component showing the upcoming task
- [x] 10.3 Create `DashboardSummary` component composing NowCard, NextCard, and today's completion counts

## 11. Frontend — Polling & Integration

- [x] 11.1 Implement 30-second polling for `/api/dashboard/summary` and `/api/routine/tasks`
- [x] 11.2 Add `visibilitychange` listener to pause/resume polling when tab is hidden/visible
- [x] 11.3 Handle fetch errors gracefully (retry on next poll cycle, show stale data)

## 12. Verification

- [x] 12.1 Run `pnpm biome check` — zero errors
- [x] 12.2 Manual test: create tasks for today, verify now/next card updates in real time
- [x] 12.3 Verify overlap warning appears when creating conflicting tasks
