# Phase 5: Polish

> [!NOTE]
> ✅ **Status: Complete** — All Phase 5 repo hygiene, CI pipeline, OpenAPI, and maintenance tasks have been implemented and verified.

> The app is correct, stable, fast, and feature-complete. Now make it maintainable and a joy to operate.

## 1. Write a README

### Problem
No `README.md` exists. A new contributor (or the user returning after 6 months) has no onboarding path.

### Implementation Plan

Create **`README.md`** at repo root with the following sections:

#### 1a. Header and badges

```md
# LifeOS

<purpose statement>  

<pnpm workspace monorepo — frontend, backend, shared contracts>

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Node](https://img.shields.io/badge/Node-ESM-green)
```

#### 1b. Tech stack overview

| Layer | Tool | Role |
|-------|------|------|
| Frontend | React 19 + Vite 6 + Tailwind 4 | UI |
| Backend | Express 4 + better-sqlite3 | API & data |
| Shared | packages/contracts | Type boundary |
| Tests | Vitest 4 | Unit tests |
| Lint | Biome | Format + lint |
| Specs | OpenSpec | Spec-driven dev |

#### 1c. Quickstart

```bash
git clone <repo>
cd lifeos
pnpm install
cp .env .env.local   # no .env.example yet? create one in step 2
pnpm dev
```

#### 1d. Architecture diagram

```
┌──────────────┐     HTTPS      ┌──────────────┐     WAL      ┌──────────────┐
│   Frontend   │ ─────────────▶ │   Backend    │ ──────────▶ │  lifeos.db  │
│  (React/Vite)│                │  (Express)   │             │  (SQLite)   │
└──────────────┘                └──────────────┘             └──────────────┘
            ▲                         │
            │                         │ uses
            │                         ▼
            │                ┌──────────────────────┐
            └────────────────│ packages/contracts   │
                             │ (shared types)       │
                             └──────────────────────┘
```

#### 1e. Module inventory

Brief table:

| Module | Purpose |
|--------|---------|
| Routine | Daily task scheduling |
| Habits | Habit formation + streak tracking |
| Workouts | Exercise library + session logging |
| Finance | Accounts, categories, transactions |
| Skills | Learning sessions + course progress |
| News | RSS feed aggregation + digestion |
| Notifications | Reminders + SSE alert stream |
| Backup | SQLite database export |

#### 1f. Contributing

- Run `pnpm check` before committing.
- `pnpm test` runs both frontend and backend tests.
- OpenSpec changes live in `openspec/changes/`.

#### 1g. License

If applicable. If this is a solo project, state clearly what constitutes reuse.

### Quality Gate

The README should be reviewed by a non-author to confirm the quickstart actually works on a fresh machine.

---

## 2. Add `.env.example`

### Problem
`.env` exists but is gitignored. A new contributor (or CI agent) has no source of truth for required environment variables.

### Implementation Plan

Create **`.env.example`** at repo root:

```bash
# ── LifeOS Environment Variables ──────────────────────────────────
# Copy this file to `.env` and adjust values for your machine.

# Backend
BACKEND_PORT=3000
FRONTEND_PORT=5173
DATABASE_PATH=./data/lifeos.sqlite

# ── Optional ──────────────────────────────────────────────────────
# NODE_ENV=development
# BACKEND_LOG_LEVEL=info
```

Leave `.env` in `.gitignore` unchanged (it should remain ignored).

Verify that `.env.example` is **tracked** by git (`git add .env.example`).

### Verification
1. Delete local `.env`. Copy `.env.example` to `.env`. Run `pnpm dev`. App should boot.

---

## 3. Add CI Pipeline

### Problem
No CI means linting, type-checking, and tests are run at the whim of the committer. A broken `main` can accumulate.

### Implementation Plan

#### 3a. Create GitHub Actions workflow

**New file:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm check

      - name: Typecheck
        run: pnpm -r exec tsc --noEmit

      - name: Build
        run: pnpm -r build

      - name: Test
        run: pnpm -r test -- --coverage
        env:
          CI: true
```

**Why a single job instead of 4?** The original plan had `install`, `lint`, `typecheck`, and `test` as separate jobs, each re-running `pnpm install`. This wastes ~3 minutes of CI time per run. A single job with sequential steps is simpler, faster, and sufficient for a solo project. If CI time becomes a bottleneck (e.g., with 10+ contributors), split into parallel jobs then.

#### 3b. Add required root scripts

**File:** `package.json` (root)

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter @lifeos/backend dev & pnpm --filter @lifeos/frontend dev",
    "build": "pnpm -r build",
    "check": "biome check .",
    "check:write": "biome check --write .",
    "typecheck": "pnpm -r exec tsc --noEmit",
    "test": "vitest run --coverage",
    "test:watch": "vitest --coverage"
  }
}
```

#### 3c. Add `tsc` to contracts and backend

Ensure `tsc --noEmit` passes:
- `packages/contracts/tsconfig.json` must target ESNext with no emit.
- `backend/tsconfig.json` must reference contracts workspace correctly.

#### 3d. Add `.nvmrc` for Node version consistency

**New file:** `.nvmrc`

```
20
```

Also add a `.node-version` file (used by `fnm`, `nodenv`, and other version managers):

```
20
```

Update the CI `actions/setup-node` step to read from `.nvmrc`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version-file: ".nvmrc"
    cache: "pnpm"
```

This ensures local development and CI use the same Node major version.

### Verification
1. Open a new PR with an intentional lint error (`const x=1`).
2. Confirm CI fails on `lint` job.
3. Fix the lint error. Confirm CI turns green.
4. Push a test commit that breaks a TypeScript type. Confirm `typecheck` job fails.

---

## 4. Add Duplicate Database Guard

### Problem
There are two database files:

- `backend/data/lifeos.sqlite` ← correct (per `DATABASE_PATH=./data/lifeos.sqlite`)
- `backend/backend/data/lifeos.sqlite` ← incorrect (created when `backend/src/index.ts` was run from the wrong CWD — `process.cwd()` returns `backend/`)

The incorrect DB is actively growing (`-wal` files indicate writes). Data may be split across two databases.

### Implementation Plan

#### 4a. Add a startup sanity check to `shared/db.ts`

```ts
import * as fs from "node:fs";
import * as path from "node:path";

export function createDatabase(dbPath: string) {
  const resolved = path.resolve(dbPath);
  const dataDir = path.dirname(resolved);

  // Guard: resolve the expected project root from __dirname and ensure the DB
  // sits under it. Using path.resolve avoids fragile string matching.
  // __dirname = backend/src/shared/ → go up 3 levels to project root
  const projectRoot = path.resolve(__dirname, "..", "..", "..");

  // If DATABASE_PATH was relative, it resolves against CWD, not __dirname.
  // Normalise by checking whether resolved sits under the project root.
  const relative = path.relative(projectRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Database path ${resolved} is outside the project root ${projectRoot}. ` +
      `Set DATABASE_PATH to a relative path like "./data/lifeos.sqlite" which resolves ` +
      `to ${path.join(projectRoot, "data", "lifeos.sqlite")}.`
    );
  }

  // Additional guard: detect if CWD is inside backend/ (a common mistake)
  const cwd = process.cwd();
  const cwdRelative = path.relative(projectRoot, cwd);
  // If CWD points to backend/, the data dir would be at backend/data/ which is correct
  // relative to project root, but only if DATABASE_PATH accounts for it.
  if (cwdRelative.startsWith("backend") && dbPath.startsWith("./")) {
    console.warn(
      `[WARN] CWD is inside backend/ (${cwd}). A relative DATABASE_PATH (${dbPath}) ` +
      `may create data at an unexpected location. Consider using an absolute path or ` +
      `running from the project root.`
    );
  }

  // Create data directory
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const Database = require("better-sqlite3");
  const db = new Database(resolved);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
```

#### 4b. Remove / migrate the duplicate DB file

**Investigation step (manual one-time):**

```bash
# Check which DB is larger:
ls -l backend/data/lifeos.sqlite*
ls -l backend/backend/data/lifeos.sqlite*

# Inspect tables in each:
sqlite3 backend/data/lifeos.sqlite ".tables"
sqlite3 backend/backend/data/lifeos.sqlite ".tables"
```

**Decision:** If both have data, merge the larger one into the smaller and delete the bad one.

```bash
# Merge (only if backend/data is smaller/older):
mv backend/backend/data/lifeos.sqlite backend/data/lifeos.sqlite
rm -rf backend/backend/data
```

If both have critical data, write a one-off merge script in `backend/src/scripts/merge-dbs.ts`.

#### 4c. Add a post-startup log of the DB path

In `backend/src/index.ts`:

```ts
console.log(`[startup] DATABASE_PATH resolved to: ${path.resolve(DB_PATH)}`);
console.log(`[startup] DB file size: ${fs.statSync(path.resolve(DB_PATH)).size} bytes`);
```

Helps diagnose future path confusion.

### Verification
1. Set `DATABASE_PATH=./backend/data/lifeos.sqlite` (a wrong path).
2. Run `pnpm dev`. Confirm startup throws the guard error.
3. Reset `DATABASE_PATH=./data/lifeos.sqlite`. Confirm the DB is now at `backend/data/lifeos.sqlite`.
4. Verify `backend/backend/data/` does not exist.

---

## 5. Tame `openspec/archive` and Improve Repo Hygiene

### Problem
`openspec/changes/archive/` contains 8 implemented proposals that are essentially project history. New contributors might mistake them for "things to do." There is no active `openspec/changes/` directory at all (all changes are archived immediately).

### Implementation Plan

#### 5a. Rename and reorganize

```bash
mv openspec/changes/archive openspec/changes/implemented
# (Optional) Add a README in openspec/changes/
```

#### 5b. Add `openspec/README.md`

```md
# OpenSpec Structure

- `specs/` — canonical specifications (never removed).
- `changes/` — active, approved changes being implemented.
- `changes/implemented/` — historical changes that shipped.
```

#### 5c. Add `.editorconfig` — optional

Many monorepos include `.editorconfig` to keep IDEs aligned on indentation, line endings, and charset.

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### Verification
1. Open `openspec/changes/implemented/`. Confirm all 8 old proposals are present.
2. Confirm `openspec/changes/` has no active in-progress changes if the project is maintaining the "archive on merge" workflow.
3. Run `rg --files openspec/` — should list only the renamed directory.

---

## 6. Add `dist/` and Data Dir to `.gitignore` (Verify + Hardening)

### Problem
`.gitignore` already covers `backend/data/*.sqlite` and `dist/`, but not WAL/SHM files. Also, it does not exclude `.env.*` (local overrides).

### Implementation Plan

Update **`.gitignore`**:

```gitignore
# Dependencies
node_modules/
pnpm-lock.yaml

# Build output
dist/
backend/dist/

# SQLite + WAL
backend/data/*.sqlite
backend/data/*.sqlite-wal
backend/data/*.sqlite-shm

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# IDE
.idea/
.vscode/
.DS_Store

# OS
Thumbs.db
```

**Note:** `pnpm-lock.yaml` should NOT be in `.gitignore`. A monorepo must track the lockfile for reproducible installs. If it's currently ignored, remove it from `.gitignore`.

### Verification
1. Confirm `git status` after a build shows no `dist/` or `backend/data/*.sqlite-wal` files.
2. Confirm `.env` is ignored (should already be, but verify `git check-ignore .env`).

---

## 7. Add OpenAPI Specification for All Routes

### Problem
The backend has 9 modules × multiple endpoints each (health, routine, habits, finance, workouts, skills, news, notifications, settings, backup). There is no machine-readable API documentation. Developers must read Express route handlers to understand request/response shapes. This causes:
- Frontend/backend type drift (despite shared contracts, HTTP serialization can differ)
- No easy way to test endpoints without reading source code
- New contributors cannot understand the API surface at a glance

### Implementation Plan

---

## 7. Add OpenAPI Specification for All Routes

### Problem
API endpoints lack formal interactive documentation. External tooling or frontend client code generation requires an OpenAPI 3.0 specification.

### Implementation Plan

#### 7a. Generate OpenAPI spec from Zod schemas

Since Phase 2.3 introduces Zod schemas in `packages/contracts/src/schemas.ts`, derive OpenAPI from those schemas using `@asteasolutions/zod-to-openapi`:

**New file:** `packages/contracts/src/openapi.ts`

```ts
import { OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "get",
  path: "/api/health",
  summary: "Health check",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ok", "degraded"] },
              timestamp: { type: "string", format: "date-time" },
              db: { type: "object", properties: { open: { type: "boolean" }, readonly: { type: "boolean" } } },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
  },
});

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "LifeOS API",
      version: "1.0.0",
      description: "Personal productivity and life management API",
    },
    servers: [{ url: "http://localhost:3000", description: "Local development" }],
  });
}
```

#### 7b. Expose OpenAPI spec & Swagger UI

**File:** `backend/src/modules/health/api/swagger.ts`

```ts
import swaggerUi from "swagger-ui-express";
import { generateOpenApiSpec } from "@lifeos/contracts";

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(generateOpenApiSpec(), {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "LifeOS API Docs",
  })
);
```

### Verification
1. Start the backend. Navigate to `http://localhost:3000/api/docs`. Confirm Swagger UI loads.
2. `curl http://localhost:3000/api/openapi.json | jq '.info.title'` — returns `"LifeOS API"`.

---

## 8. Project Maintenance Checklist (Ongoing)

### Weekly / Per-PR Checklist

- [ ] `pnpm check` passes.
- [ ] `pnpm test` passes.
- [ ] `pnpm build` passes.
- [ ] No `any` types introduced.
- [ ] New files have a matching test.
- [ ] Changes to backend modules update corresponding specs in `openspec/specs/`.
- [ ] Schema changes include a new migration in `backend/src/shared/migrations.ts`.
- [ ] Modified API routes are reflected in the OpenAPI spec.

### Monthly Checklist

- [ ] Run SQLite `VACUUM;` to reclaim unused disk space and optimize database file layout.
- [ ] Purge news articles older than 60 days to prevent unbounded DB growth.
- [ ] Review `backend/data/` size. If growing large, archive old rows (Phase 4.10).
- [ ] Review `openspec/changes/` — move completed changes to `implemented/`.
- [ ] Run `pnpm outdated` and decide whether to upgrade dependencies.
- [ ] Verify backups: `GET /api/backup` returns a valid file.
- [ ] Check `backend/data/backups/` — confirm daily backups are created and old ones pruned.
- [ ] Review error logs (structured JSON) for recurring issues.

### Quarterly Checklist

- [ ] Audit overused Tailwind classes: run `rg 'gray-7|gray-8|gray-9' frontend/src`.
- [ ] Audit duplicate types between contracts and domain folders.
- [ ] **Dedicated a11y audit:** Tab through every page with keyboard only. Target: 0 critical violations, WCAG AA compliance.
- [ ] Run Lighthouse performance audit. Verify bundle size budgets (Phase 3.9) are not exceeded.

---

## 9. Add Offline / PWA Shell Support (Optional)

### Problem
When internet access is unavailable or offline, the web SPA requires assets to be cached locally to render the shell interface.

### Implementation Plan
- Configure `vite-plugin-pwa` in `frontend/vite.config.ts`.
- Add web app manifest (`manifest.json`) and service worker for SPA shell caching.

### Verification
1. Disconnect network in browser DevTools. Reload app — shell renders offline cleanly.

---

## Completion Criteria for Phase 5

| Check | How to verify |
|--------|---------------|
| README is accurate | A collaborator clones fresh and gets the app running in 5 minutes without asking. |
| `.env.example` works | Delete `.env`, copy example, `pnpm dev` boots. |
| CI passes on main | Green check on the last 10 commits. |
| Duplicate DB guard active | Running with wrong `DATABASE_PATH` throws, not silently creates a new DB. |
| No unintended ignored files | `git ls-files --others --ignored --exclude-standard` shows only expected artifacts. |
| Migrations work | Delete DB, run app, verify `settings` table exists. |
| Backups run daily | Restart app twice on same day — only one backup file created. |
| OpenAPI spec exists | `GET /api/openapi.json` returns valid OpenAPI 3.0 document. Swagger UI renders at `/api/docs`. |
