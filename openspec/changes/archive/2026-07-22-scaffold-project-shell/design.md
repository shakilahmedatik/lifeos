## Context

LifeOS is a personal local-first life operating system. The complete specification
exists (`LifeOS Complete Specification.md`) but the repository contains zero code.
This change creates the full-stack project skeleton that all future modules will
build on.

Constraints from the spec:
- Single user, single Mac, local-only (no cloud, no auth)
- SQLite via better-sqlite3, WAL mode
- Express backend, React frontend, Vite build
- TypeScript strict mode, ESM modules
- Dark theme, dashboard-first UX
- Module template: `domain/` → `application/` → `ports/` → `adapters/sqlite/` → `api/`

## Goals / Non-Goals

**Goals:**
- Working `pnpm dev` that starts both backend and frontend with hot reload
- Backend serves health check at `GET /api/health`
- Frontend fetches health check and displays connection status
- SQLite database file created with migration runner wired
- Empty module folders ready for Phase 0 (Routine + Dashboard)
- Biome configured for linting and formatting
- `.env` for configuration (ports, database path)

**Non-Goals:**
- Building any business module (Routine, Dashboard, etc.) — that's Phase 0
- Setting up tests (Vitest comes with Phase 1 per spec)
- CI/CD, Docker, or deployment config — local-only
- Shared type contracts beyond a placeholder — premature until modules exist

## Decisions

### 1. pnpm over npm or yarn

**Choice:** pnpm with workspaces

**Why:** Faster installs, strict dependency resolution (prevents phantom deps),
monorepo-native workspace protocol (`pnpm:workspace:*`). The spec didn't mandate
a package manager — pnpm is the pragmatic default for 2026 TypeScript monorepos.

**Alternatives considered:**
- npm workspaces: simpler but slower, looser hoisting
- yarn (berry): more complex config, plug-n-play adds friction

### 2. Biome over ESLint + Prettier

**Choice:** Biome for both linting and formatting

**Why:** Single tool, fast, TypeScript-native, zero config by default. Replaces
two tools (ESLint + Prettier) with one. The user explicitly requested Biome.

**Alternatives considered:**
- ESLint + Prettier: industry standard but two configs, slower, plugin overhead

### 3. tsx for backend dev, tsc for build

**Choice:** `tsx watch` for development, `tsc` for production build

**Why:** tsx provides instant TypeScript execution with watch mode — no
compilation step during development. tsc for build ensures type-checking
and proper ESM output for production.

### 4. Vite proxy over CORS

**Choice:** Vite dev server proxies `/api` to backend on port 3000

**Why:** Avoids CORS configuration during development. Frontend and backend
appear on the same origin from the browser's perspective. Production would
use a reverse proxy or same-origin serving — but that's not in scope now.

### 5. .env over hardcoded values

**Choice:** dotenv for backend, Vite's built-in `.env` for frontend

**Why:** Ports and database path should be configurable without code changes.
Backend uses `dotenv`, frontend uses Vite's native `.env` support (auto-exposes
`VITE_`-prefixed vars).

### 6. ESM everywhere

**Choice:** `"type": "module"` in all package.json files

**Why:** Spec mandates ESM. Modern TypeScript + Node.js ESM is the default
path. No CommonJS interop needed.

### 7. No ORM — raw SQL

**Choice:** better-sqlite3 with raw SQL, no Prisma/Drizzle/etc.

**Why:** Spec explicitly says no ORM. Single user, single SQLite file — raw
SQL is simpler and the spec already defines all schemas.

## Risks / Trade-offs

- **[Risk] better-sqlite3 native compilation** → Requires Node.js build tools
  (python3, make, gcc). On macOS with Xcode CLI tools installed, this works
  out of the box. Document in README.

- **[Risk] Biome unfamiliarity** → If the user hasn't used Biome before, the
  lint rules may need tuning. Start with defaults, adjust as friction appears.

- **[Risk] Empty scaffold feels like no progress** → Mitigate by making the
  health check visible: `curl localhost:3000/api/health` returns JSON, browser
  shows "Connected" status. Proof of life.

- **[Trade-off] No shared types yet** → `packages/contracts` is a placeholder.
  Types will be hand-synced until duplication becomes painful. This is
  intentional per the spec (§4 Future technology decisions).
