# LifeOS Improvement Plan

Five-phase roadmap for the LifeOS project. Each phase builds on the previous one.

## Phase Overview

| Phase | Focus | Est. effort | Risk if skipped |
|-------|-------|-------------|-----------------|
| [Phase 1](phase-1-critical-path.md) | Critical Path — data integrity, error handling, health, auth | Medium | Data corruption, blank screen, silent failures, unauthenticated access |
| [Phase 2](phase-2-stability.md) | Stability — design system, validation, tests, rate limiting, mobile | Medium | Inconsistent UI, bad data writes, no regression safety net, API abuse |
| [Phase 3](phase-3-performance.md) | Performance — caching, code splitting, migrations, indexes, scheduler health | Medium | Slow interactions, bundle bloat, schema migration pain, query regressions |
| [Phase 4](phase-4-features.md) | Features — settings, search, backup & restore, bulk data, CSV import/export, a11y | Large | Missing user-facing capabilities |
| [Phase 5](phase-5-polish.md) | Polish — docs, CI, OpenAPI, hygiene, maintenance, PWA shell | Medium | Hard onboarding, no CI safety, dead docs |

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
| Phase 1.7 (Basic Auth) | — | Baseline security middleware |
| Phase 2.1 (Dark theme) | — | CSS custom property design tokens |
| Phase 2.2 (Input/Select) | Phase 2.1 | Shared `Input`, `Select` components (`useId`) |
| Phase 2.3 (Zod validation) | — | `packages/contracts/src/schemas.ts` |
| Phase 2.4 (SSE leak fix) | — | `useUnreadCount` polling hook |
| Phase 2.5 (Frontend tests) | Phase 1.4, 1.5 | `renderWithProviders` helper |
| Phase 2.6 (Rate limiting) | — | `express-rate-limit` middleware |
| Phase 2.7 (Mobile UI) | Phase 2.1 | Collapsible sidebar + touch targets |
| Phase 3.1 (Dashboard SSE) | Phase 1.1, 1.5 | `useDashboardSSE` hook (Deferred) |
| Phase 3.2 (API cache) | — | `ApiCache` class (or TanStack Query) |
| Phase 3.3 (Memoize) | — | `useMemo` + `React.memo` patterns |
| Phase 3.4 (Visibility polling) | — | `useVisibilityPolling` hook |
| Phase 3.5 (Code splitting) | — | Lazy-loaded routes |
| Phase 3.6 (Migration runner) | — | `runMigrations()` in `db.ts` |
| Phase 3.7 (SSE heartbeat) | Phase 2.4 | Stale client cleanup in broadcaster |
| Phase 3.8 (DB Indexes) | Phase 3.6, 4.10 | Migration `011_indexes.sql` |
| Phase 3.9 (Bundle analysis) | Phase 3.5 | `size-limit` config, `vite-plugin-visualizer` |
| Phase 3.10 (Scheduler health) | Phase 1.6 | Enhanced `/api/health` monitoring |
| Phase 4.1 (Workout detail) | Phase 3.7 | Wired workout timer + SSE |
| Phase 4.2 (Search) | Phase 2.2 | `useDebounce` hook + search inputs |
| Phase 4.3 (Settings) | Phase 3.6, Phase 1.1 | Migration `009_settings.sql`, settings UI |
| Phase 4.4 (Heatmap) | Phase 1.1 | Habit weekly review widget |
| Phase 4.5 (CSV export) | Phase 1.1 | CSV download utility (`fast-csv`) |
| Phase 4.6 (Confirm dialog) | Phase 1.4 | `ConfirmDialog` component |
| Phase 4.7 (Backup & Restore) | — | Auto-backup + `POST /api/backup/restore` |
| Phase 4.8 (Structured logging) | — | `logger` utility |
| Phase 4.9 (State management) | Phase 4.3 | Zustand stores for shared state |
| Phase 4.10 (Bulk data) | Phase 3.6, 4.6, 4.5 | Migration `010_archive.sql`, archive endpoints |
| Phase 4.11 (CSV import) | Phase 4.5, 2.3 | `papaparse` & `fast-csv` import per module |
| Phase 4.12 (a11y verification) | Phase 2.1 | Accessible timer & modal controls |
| Phase 5.1 (README) | All | Project README |
| Phase 5.2 (.env.example) | — | `.env.example` |
| Phase 5.3 (CI pipeline) | Phase 3.9 | GitHub Actions workflow |
| Phase 5.4 (DB guard) | — | Startup guard + path resolution |
| Phase 5.5 (OpenSpec hygiene) | — | Renamed archive + `.editorconfig` |
| Phase 5.6 (.gitignore hardening) | — | Updated `.gitignore` |
| Phase 5.7 (OpenAPI spec) | Phase 2.3, 1.6 | Swagger UI + spec generation |
| Phase 5.8 (Checklist) | All | Maintenance checklist (`VACUUM`, news purge) |
| Phase 5.9 (PWA shell) | Phase 3.5 | Offline SPA shell service worker |

## Status

| Phase | Status |
|-------|--------|
| 1: Critical Path | ✅ Complete |
| 2: Stability | ✅ Complete |
| 3: Performance | ✅ Complete |
| 4: Features | 📝 Planned |
| 5: Polish | 📝 Planned |

## How to Use This Plan

1. Start with Phase 1 and work sequentially.
2. After completing each phase, update the Status table above.
3. If you cherry-pick an item, check its Dependencies section first.
4. Run the Verification checks listed for each item before marking it done.
