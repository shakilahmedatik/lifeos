# Skills Module — End-to-End Audit Report

**Project:** lifeos
**Module:** skills (frontend + backend + contracts)
**Audit date:** July 29, 2026
**Previous audit:** This document (supersedes the earlier draft)
**Scope:** Architecture/design, functional correctness, security, code quality, performance, database schema, test coverage

---

## 1. ARCHITECTURE / DESIGN

### 1.1 Structure

```
backend/src/modules/skills/
├── api/router.ts                # Express routes (infrastructure)
├── application/*.ts             # Use-case services (application layer)
├── domain/types.ts              # Domain types (re-export from contracts)
├── ports/*.ts                   # Repository interfaces (ports)
├── adapters/sqlite/*.ts         # SQLite implementations (adapters)
├── index.ts                     # DI module initializer
└── __tests__/                   # Unit + integration tests

frontend/src/modules/skills/
├── SkillsPage.tsx               # Main page (4-tab layout)
├── LearningWidget.tsx           # Dashboard widget
├── backup.ts                    # Export/import/validation logic
├── BackupPanel.tsx              # UI for backup export/import
├── useSkillCategories.ts        # Hook for skill areas CRUD
├── useLearningResources.ts      # Hook for learning resources CRUD
├── useLearningLogs.ts           # Hook for learning sessions CRUD
├── CategoryCard/Form/List.tsx   # Skill area UI components
├── CourseCard/Form/List.tsx     # Learning resource UI components
├── SessionCard/Form/List.tsx    # Learning session UI components
├── ConfirmDialog.tsx            # Reusable delete confirmation modal
├── types.ts                     # Re-exports from @lifeos/contracts + LearningBackup
├── index.ts                     # Public exports
└── __tests__/                   # Component, hook, and utility tests

packages/contracts/src/
├── index.ts (lines 340-423)     # Skill types + interfaces
└── schemas.ts (lines 224-268)   # Zod validation schemas
```

### 1.2 Dependency Flow

```
Router → Services → Repository Ports → SQLite Adapters → DB
```

Hexagonal / ports-and-adapters pattern. No circular dependencies. `LearningLogService` correctly receives `resourceRepo` and `skillAreaRepo` to compute progress/summary.

### 1.3 Layer Assessment

- **Good:** Router depends only on services; services depend only on ports; adapters depend only on DB
- **Good:** `SkillAreaService.create` checks duplicate name; `LearningResourceService.create` validates parent area exists
- **Fixed (previously):** `LearningResourceService.update` now validates `skillAreaId` exists on patch
- **Adequate:** `SkillAreaService.delete` relies on DB cascade (acceptable for SQLite)

---

## 2. FUNCTIONAL CORRECTNESS

### 2.1 Previously Fixed Bugs (from initial draft audit)

| ID | Component | Issue | Severity | Status |
|---|---|---|---|---|
| F-01 | `backup.ts` | Import stored in `localStorage` only, never called backend | Critical | Fixed |
| F-02 | `CourseCard` / `SkillsPage` | N+1 progress API calls per resource | High | Fixed |
| F-03 | `useCourseProgress.ts` | File named inconsistently with its export | Medium | Fixed |
| F-04 | `index.ts` | Export paths referenced old filenames | Medium | Fixed |
| F-05 | `learning-log-service.ts` | `getResourceProgress` guard present — no bug | Resolved | Confirmed |
| F-06 | `SkillsPage.tsx` | Unsafe `as` type casts on edit submissions | Low | Fixed |
| F-07 | `backup.ts` | Backup has no pagination/size limits | Medium | Partially addressed |
| F-08 | `router.ts` / `resource-service.ts` | Missing `skillAreaId` validation in update | Medium | Fixed |
| F-09 | `backup.ts` | Deprecated `.substr()` | Low | Fixed |

### 2.2 New Findings (from this audit)

#### N-01 — UI/UX: BackupPanel misstates import behavior
**File:** `frontend/src/modules/skills/BackupPanel.tsx:86`
**Description:** The import section says *"This will replace all existing data"* but the backend `POST /api/skills/import` endpoint is **additive** — it creates entries and silently skips duplicates. Existing data is never removed. The UI text is misleading.
**Severity:** Medium — functional mismatch between UI copy and behavior.
**Recommendation:** Either make the import actually clear existing data first, or update the UI text to say *"Import data from a backup file. Duplicate entries will be skipped."*

#### N-02 — Migration dependency: `updated_at` column exists only after migration 018
**Files:** `backend/src/shared/migrations/008_skills.sql`, `018_skills_logs_updated_at.sql`
**Description:** Migration `008_skills.sql` creates the `learning_logs` table **without** an `updated_at` column. Migration `018_skills_logs_updated_at.sql` adds it via `ALTER TABLE`. The SQLite adapter (`sqlite-learning-log-repository.ts`) references `updated_at` in both `INSERT` and `UPDATE` statements. If `018` has not been applied, all log creation/update operations will fail with a SQL error.
**Severity:** Medium — deployment dependency. The migration runner applies files in sorted order so this works in practice, but the base schema (008 alone) is not self-consistent with the adapter code.
**Recommendation:** Consider incorporating `updated_at` into the base `008_skills.sql` schema and removing migration `018`, or document this dependency clearly.

#### N-03 — Test schema drift: `createTestDb` diverges from actual migration
**File:** `backend/src/modules/skills/__tests__/skills-adapters.test.ts:12-41`
**Description:** The test helper `createTestDb()` creates `learning_logs` with `updated_at` in the `CREATE TABLE` statement. The actual production migration `008_skills.sql` does not include this column. Tests pass but do not verify the actual migration path (008 → 018).
**Severity:** Low — tests are still valid for the final schema, but they don't catch regressions in the migration order.
**Recommendation:** Either make `createTestDb` match 008 exactly (without `updated_at`) and then run 018 within the test, or include `updated_at` in the 008 migration.

#### N-04 — No validation that `unitsCompleted` ≤ `totalUnits`
**Files:** `packages/contracts/src/schemas.ts:252-258`
**Description:** `NewLearningLogInputSchema` validates `unitsCompleted` as `z.number().min(0).optional()` but never checks it against the parent resource's `totalUnits`. Users can log more units than a resource defines. The progress calculation (`getResourceProgress`) caps at 100%, but semantically this is odd.
**Severity:** Low — cosmetic/semantic. No crash or data corruption risk.
**Recommendation:** Consider optional cross-field validation in the service layer.

#### N-05 — Missing `encodeURIComponent` in date range URL
**File:** `frontend/src/lib/api.ts:186`
**Description:** `getLearningLogsByRange` constructs a URL via string interpolation: `` `/api/skills/logs/range?startDate=${startDate}&endDate=${endDate}` `` without `encodeURIComponent`. For well-formed `YYYY-MM-DD` dates this is safe, but input is user-provided via a date picker that could theoretically produce unusual values.
**Severity:** Low
**Recommendation:** Wrap params with `encodeURIComponent`.

#### N-06 — `LearningWidget` fetches data independently of SkillsPage
**File:** `frontend/src/modules/skills/LearningWidget.tsx:10-12`
**Description:** The dashboard widget calls `useLearningLogs()`, `useLearningResources()`, and `useSkillAreas()` — each triggering API calls. If a user has both the SkillsPage and the dashboard visible (or navigates between them), the same data is fetched redundantly. There is no shared cache or context.
**Severity:** Medium — performance. Three extra API calls per dashboard render, with no deduplication.
**Recommendation:** Consider a shared query cache (e.g., React Query/SWR) or hoisting state to a shared context/parent.

#### N-07 — `getProgressBatch` silently omits missing resources from response
**Files:** `backend/src/modules/skills/api/router.ts:133-143`
**Description:** The `progress-batch` endpoint filters out `undefined` progress items (line 141: `if (p) progressArray.push(p)`). The return type is `ResourceWithProgress[]`, but the actual response may have fewer items than requested. The frontend compensates correctly (fills in `null` for missing IDs), but the API contract is imprecise.
**Severity:** Low
**Recommendation:** Either return `(ResourceWithProgress | null)[]` with null placeholders, or document the contract.

#### N-08 — `ConfirmDialog` lacks keyboard accessibility
**File:** `frontend/src/modules/skills/ConfirmDialog.tsx`
**Description:** The modal dialog does not handle `Escape` (to cancel) or `Enter` (to confirm) keyboard events. No focus trapping is implemented.
**Severity:** Low — accessibility
**Recommendation:** Add `onKeyDown` handlers for `Escape` → `onCancel`, `Enter` → `onConfirm`, and trap focus within the dialog.

#### N-09 — `useLearningLogs` has an unused `resourceId` parameter path
**File:** `frontend/src/modules/skills/useLearningLogs.ts:5`
**Description:** The hook accepts an optional `resourceId` parameter and supports filtering by resource. However, neither `SkillsPage` nor `LearningWidget` passes this parameter. The code path exists but is dead code in the current UI.
**Severity:** Informational — not a bug, but adds unnecessary API surface.
**Recommendation:** Remove the parameter if not needed, or wire it up to a use case in the UI.

### 2.3 Data Integrity Gaps

- **No app-layer foreign key enforcement:** Services rely on SQLite's `ON DELETE CASCADE`. For single-threaded SQLite this is acceptable.
- **No transaction wrapping:** If future features require atomic multi-step operations, the repository ports have no transaction abstraction.
- **Import is additive, not a replace:** As noted in N-01, importing a backup does not clear existing data. This is the most significant behavioral mismatch.

---

## 3. SECURITY

### 3.1 Input Validation
- **Good:** All mutation endpoints use `validateBody()` with Zod schemas from `@lifeos/contracts`
- **Good:** Backup import validates with `BackupImportSchema` (Zod)
- **Good:** Date regex validates `YYYY-MM-DD` format for log dates

### 3.2 SQL Injection
- All adapters use `db.prepare("... ? ...").run(...)` — parameterized queries throughout
- Dynamic `IN (...)` clause in `getByResourceIds` uses only the number of placeholders from array length, values passed via `.all(...resourceIds)` — safe

### 3.3 Authentication
- Skills router mounted behind `authMiddleware` in `app.ts` — all routes protected

### 3.4 Data Exposure
- API returns full objects including `createdAt`/`updatedAt`. No PII exposed.
- `notes` field is free text stored and returned as-is. Acceptable for local-first app.

### 3.5 Backup Security
- `JSON.parse()` on user file input with no size limit — potential memory exhaustion risk with maliciously large files. No code execution risk since parsed data only flows to `api.importBackup()` which validates with Zod.
- `validateBackup` checks top-level types but does not deeply validate nested arrays. The backend Zod schema catches malformed items.

---

## 4. CODE QUALITY

### 4.1 Naming & Organization
- Service names match repository ports (`LearningLogService`, `LearningLogRepository`)
- Hook files match exported names (`useLearningResources.ts` → `useLearningResources`)
- Clean separation of concerns

### 4.2 Type Safety
- No unsafe `as` casts in `SkillsPage.tsx` (F-06 fixed)
- `types.ts` cleanly re-exports from `@lifeos/contracts`
- Frontend components are well-typed with explicit interfaces

### 4.3 Error Handling
- `SkillsPage` displays red error banner when any hook fails
- `CourseCard` shows "Loading..." when progress is null (graceful degradation)
- Backup import catches errors and reports them in a user-facing message
- Service layer throws descriptive errors (duplicate name, area not found)

### 4.4 Dead / Unused Code
- `useLearningLogs` `resourceId` parameter is unused in practice (N-09)
- `api.getResourcesByArea` is defined but not called from anywhere in the skills UI
- `api.getSkillAreaSummary` is defined but not called from anywhere

---

## 5. PERFORMANCE

### 5.1 Database Queries
- `getAll()` returns all rows without pagination. Acceptable for personal-use dataset.
- Indexes: `idx_learning_resources_skill_area` (single-column), `idx_learning_logs_resource_date` (composite). **Missing a single-column index on `learning_logs.date`** — the `getByDateRange` query filters by date only, and the composite index's leading column is `resource_id`. For pure date-range queries, a separate index on `date` would improve performance.
- `getByResourceIds` builds `IN (...)` — safe for expected small arrays
- `progress-batch` limits to 100 IDs (`MAX_BATCH = 100`)

### 5.2 Frontend Performance
- N+1 progress calls eliminated (F-02 fixed) — single `POST /api/skills/resources/progress-batch` replaces individual requests
- `LearningWidget` performs 3 independent API calls on render (N-06)
- `SkillsPage` calculates `resourceCounts` via manual loop — fine for small arrays

### 5.3 Memory / State
- No memory leaks detected. Hooks use proper `useEffect` dependency arrays.

---

## 6. DATABASE / SCHEMA

### 6.1 Schema (cumulative from 008 + 018)

```sql
skill_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT,
  updated_at TEXT
)

learning_resources (
  id TEXT PRIMARY KEY,
  skill_area_id TEXT REFERENCES skill_areas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('course','book','project','article')),
  total_units REAL,
  unit TEXT CHECK (unit IN ('chapters','videos','hours')),
  created_at TEXT,
  updated_at TEXT
)

learning_logs (
  id TEXT PRIMARY KEY,
  resource_id TEXT REFERENCES learning_resources(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  minutes_spent INTEGER NOT NULL,
  units_completed REAL,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT    -- added by migration 018
)
```

Indexes: `idx_learning_resources_skill_area` (`skill_area_id`), `idx_learning_logs_resource_date` (`resource_id`, `date`)

### 6.2 Schema Gaps
- No `deleted_at` / soft-delete — hard deletes are permanent
- No separate `date` index for date-range queries
- `updated_at` on `learning_logs` is in migration 018 but not in 008 — see N-02

---

## 7. END-TO-END DATA FLOWS

### 7.1 Create Skill Area
```
SkillsPage → CategoryForm → handleCategorySubmit
→ useSkillAreas.addArea() → api.createSkillArea()
→ router (validateBody) → SkillAreaService.create()
→ checks duplicate name → SQLite INSERT
```
**Status:** Works. Duplicate names rejected.

### 7.2 Create Learning Resource
```
SkillsPage → CourseForm → handleCourseSubmit
→ useLearningResources.addResource() → api.createLearningResource()
→ router → LearningResourceService.create()
→ checks skillAreaRepo.getById() → SQLite INSERT
```
**Status:** Works. Parent area validated.

### 7.3 Update Learning Resource
```
SkillsPage → CourseForm → handleCourseSubmit(edit)
→ useLearningResources.editResource() → api.updateLearningResource()
→ router → LearningResourceService.update()
→ if patch.skillAreaId, validate area exists → SQLite UPDATE
```
**Status:** Works. Validates new skillAreaId (F-08 fixed).

### 7.4 Log Learning Session
```
SkillsPage → SessionForm → handleSessionSubmit
→ useLearningLogs.addLog() → api.logLearningSession()
→ router → LearningLogService.log() → SQLite INSERT
```
**Status:** Works. DB constraint prevents invalid resource_id.

### 7.5 Compute Progress (Batch)
```
SkillsPage useEffect → api.getProgressBatch(ids)
→ POST /api/skills/resources/progress-batch
→ LearningLogService.getResourceProgress() x N (max 100)
→ return ResourceWithProgress[]
→ SkillsPage maps into Record<id, ResourceWithProgress|null>
→ CourseList → CourseCard
```
**Status:** Single batch call replaces N+1 (F-02 fixed).

### 7.6 Backup Export
```
BackupPanel → handleExport() → exportBackup()
→ createBackup() → fetch all areas, resources, logs
→ JSON.stringify() → downloadBlob
```
**Status:** Works.

### 7.7 Backup Import
```
BackupPanel → handleImport(file) → FileReader → importBackup(json)
→ validateBackup() → api.importBackup({ areas, resources, logs })
→ POST /api/skills/import → Zod validation
→ skillAreaService.create() for each area (skip dupes)
→ resourceService.create() for each resource (skip if parent missing)
→ logService.log() for each log (skip if parent missing)
→ return counts → onImportComplete → refresh all state
```
**Status:** Import persists data to backend (F-01 fixed). **But:** import is additive, not a replace — see N-01.

---

## 8. ISSUE SUMMARY

### Remaining Issues

| ID | Severity | Component | Description |
|---|---|---|---|
| **N-01** | **Medium** | `BackupPanel.tsx:86` | UI says "This will replace all existing data" but import is additive |
| **N-02** | **Medium** | `008_skills.sql` vs `018_*.sql` | `updated_at` column split across migrations; 008 alone doesn't match adapter INSERT |
| **N-03** | Low | `skills-adapters.test.ts` | Test helper diverges from actual migration 008 schema |
| **N-04** | Low | `schemas.ts` / service | No validation that `unitsCompleted` ≤ resource's `totalUnits` |
| **N-05** | Low | `api.ts:186` | Missing `encodeURIComponent` in date range URL |
| **N-06** | Medium | `LearningWidget.tsx` | Independent API calls duplicate SkillsPage fetches; no cache |
| **N-07** | Low | `router.ts:133-143` | `progress-batch` response omits missing resources from array |
| **N-08** | Low | `ConfirmDialog.tsx` | No keyboard event handling (Escape/Enter) |
| **N-09** | Info | `useLearningLogs.ts:5` | Unused `resourceId` parameter |

### All Previously Found Bugs — Fixed (F-01 through F-09)

### Schema Gap
- Missing single-column index on `learning_logs.date`

### Dead Code / Unused Endpoints
- `GET /api/skills/resources/by-area/:areaId` not consumed by frontend
- `GET /api/skills/summary/:areaId` not consumed by frontend
- `api.getResourcesByArea()` and `api.getSkillAreaSummary()` in `api.ts` are never called

---

## 9. TEST COVERAGE

**Backend** (`backend/src/modules/skills/__tests__/`):

| File | Tests | Scope |
|---|---|---|
| `skills-service.test.ts` | 29 | Unit tests: service layer with mock repos — create, list, update, delete, duplicate rejection, progress computation, summary, FK validation |
| `skills-adapters.test.ts` | 16 | Integration tests: SQLite repos in `:memory:` — CRUD, name lookup, date range, FK enforcement |

**Frontend** (`frontend/src/modules/skills/__tests__/`):

| File | Tests | Scope |
|---|---|---|
| `backup.test.tsx` | 21 | `validateBackup()`: type checks, edge cases (null, array, wrong schema, missing fields) |
| `components.test.tsx` | 35 | Render/interaction: CourseCard, CategoryCard, SessionCard, ConfirmDialog, CourseList, CategoryList, SessionList, BackupPanel |
| `hooks.test.tsx` | 3 | Smoke tests: each hook is a function |

**Total:** 104 skills-specific tests, all passing (confirmed).

**Coverage gaps:**
- No tests for the Express router (integration with services)
- No tests for `SkillsPage` or `LearningWidget` (component integration)
- No tests for `CourseForm`, `CategoryForm`, `SessionForm` (form submission/validation)
- No E2E tests that exercise the full frontend→backend→DB pipeline

---

## 10. RECOMMENDATIONS

### P0 / P1 — Immediate

None remaining from previous audit. All critical/high bugs fixed.

### P2 — Short Term

1. **Fix UI copy (N-01):** Update `BackupPanel.tsx:86` to describe additive import, or implement delete-then-insert behavior.
2. **Consolidate schema (N-02):** Move `updated_at` into `008_skills.sql` base migration to make the adapter self-consistent.
3. **Add cache layer (N-06):** Consider React Query or SWR for deduplicating API calls between dashboard widget and SkillsPage.

### P3 — Future / Nice-to-Have

4. **Add `date` index** for `getByDateRange` performance.
5. **Soft delete** support (`deleted_at` columns + filtered queries).
6. **Transaction support** in repository ports for future multi-step operations.
7. **Keyboard accessibility** for `ConfirmDialog` (Escape/Enter).
8. **Remove or wire up** unused endpoints (`/by-area/:areaId`, `/summary/:areaId`).
9. **Add router-level integration tests** and component-level tests for forms.
10. **Encode URL params** in `getLearningLogsByRange`.
11. **Cross-field validation** for `unitsCompleted` vs `totalUnits`.

---

## 11. CONCLUSION

The skills module is **well-architected** with clean hexagonal separation, strong input validation, and parameterized SQL throughout. **All previously identified critical and high-severity bugs are fixed** (import persistence, N+1 progress calls, file naming, type safety, error display).

The module has **104 passing tests** (45 backend + 59 frontend) covering services, adapters, components, and utilities.

**New findings from this audit are mostly low-severity** — the most significant gap is the **misleading UI text about backup import behavior** (N-01: says "replace" but actually appends) and the **schema migration dependency** (N-02: `updated_at` column in adapter but not in base schema). These are medium-severity items that should be addressed in the next maintenance cycle.

---

*End of audit.*
