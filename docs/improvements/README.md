# LifeOS Improvement Plan

Five-phase roadmap for the LifeOS project. Each phase builds on the previous one.

## Phase Overview

| Phase | Focus | Est. effort | Risk if skipped |
|-------|-------|-------------|-----------------|
| [Phase 1](phase-1-critical-path.md) | Critical Path — data integrity, error handling, health, auth | Medium | Data corruption, blank screen, silent failures, unauthenticated access |
| [Phase 2](phase-2-stability.md) | Stability — design system, validation, tests, a11y | Medium | Inconsistent UI, bad data writes, no regression safety net |
| [Phase 3](phase-3-performance.md) | Performance — caching, code splitting, migrations, indexes | Medium | Slow interactions, bundle bloat, schema migration pain, query regressions |
| [Phase 4](phase-4-features.md) | Features — settings, search, backup, bulk data, CSV import/export | Large | Missing user-facing capabilities |
| [Phase 5](phase-5-polish.md) | Polish — docs, CI, OpenAPI, a11y, hygiene | Medium | Hard onboarding, no CI safety, dead docs |

## Cross-Phase Dependencies

Items in later phases depend on artifacts from earlier phases. Implement phases in order, or check dependencies before cherry-picking.

| Item | Depends on | Provided artifact |
|------|-----------|-------------------|
| Phase 1.1 (Timezone) | — | `getClientDateString()` in contracts |
| Phase 1.2 (Reminder fix) | — | Null-safe reminder handling |
| Phase 1.3 (Type alignment) | — | Contracts as single source of truth |
| Phase 1.4 (Error boundary) | — | `ErrorBoundary` component |
| Phase 1.5 (Toast system) | — | `ToastProvider`, `useAppToast` hook |
| Phase 1.6 (Health endpoint) | — | `GET /api/health` |
| Phase 2.1 (Dark theme) | — | CSS custom property design tokens |
| Phase 2.2 (Input/Select) | Phase 2.1 | Shared `Input`, `Select` components |
| Phase 2.3 (Zod validation) | — | `packages/contracts/src/schemas.ts` |
| Phase 2.4 (SSE leak fix) | — | `useUnreadCount` polling hook |
| Phase 2.5 (Frontend tests) | Phase 1.4, 1.5 | `renderWithProviders` helper |
| Phase 3.1 (Dashboard SSE) | Phase 1.1, 1.5 | `useDashboardSSE` hook |
| Phase 3.2 (API cache) | — | `ApiCache` class |
| Phase 3.3 (Memoize) | — | `useMemo` + `React.memo` patterns |
| Phase 3.4 (Visibility polling) | — | `useVisibilityPolling` hook |
| Phase 3.5 (Code splitting) | — | Lazy-loaded routes |
| Phase 3.6 (Migration runner) | — | `runMigrations()` in `db.ts` |
| Phase 3.7 (SSE heartbeat) | Phase 2.4 | Stale client cleanup in broadcaster |
| Phase 3.8 (Bundle analysis) | Phase 3.5 | `size-limit` config, `vite-plugin-visualizer` |
| Phase 4.1 (Workout detail) | Phase 3.7 | Wired workout timer + SSE |
| Phase 4.2 (Search) | Phase 2.2 | `useDebounce` hook + search inputs |
| Phase 4.3 (Settings) | Phase 3.6, Phase 1.1 | `UserSettings` in contracts, settings UI |
| Phase 4.4 (Heatmap) | Phase 1.1 | Habit weekly review widget |
| Phase 4.5 (CSV export) | Phase 1.1 | CSV download utility |
| Phase 4.6 (Confirm dialog) | Phase 1.4 | `ConfirmDialog` component |
| Phase 4.7 (Backup) | — | Auto-backup on startup |
| Phase 4.8 (Structured logging) | — | `logger` utility |
| Phase 4.9 (State management) | Phase 4.3 | Zustand stores for shared state |
| Phase 4.10 (Bulk data) | Phase 3.6, 4.6, 4.5 | Archive/purge endpoints |
| Phase 4.11 (CSV import) | Phase 4.5, 2.3 | Drag/drop CSV import per module |
| Phase 5.1 (README) | All | Project README |
| Phase 5.2 (.env.example) | — | `.env.example` |
| Phase 5.3 (CI pipeline) | Phase 3.8 | GitHub Actions workflow |
| Phase 5.4 (DB guard) | — | Startup guard + path resolution |
| Phase 5.5 (OpenSpec hygiene) | — | Renamed archive + `.editorconfig` |
| Phase 5.6 (.gitignore hardening) | — | Updated `.gitignore` |
| Phase 5.7 (Checklist) | All | Ongoing maintenance checklists |
| Phase 5.8 (OpenAPI spec) | Phase 2.3, 1.6 | Swagger UI + spec generation |

## Status

| Phase | Status |
|-------|--------|
| 1: Critical Path | 📝 Planned |
| 2: Stability | 📝 Planned |
| 3: Performance | 📝 Planned |
| 4: Features | 📝 Planned |
| 5: Polish | 📝 Planned |

## How to Use This Plan

1. Start with Phase 1 and work sequentially.
2. After completing each phase, update the Status table above.
3. If you cherry-pick an item, check its Dependencies section first.
4. Run the Verification checks listed for each item before marking it done.
