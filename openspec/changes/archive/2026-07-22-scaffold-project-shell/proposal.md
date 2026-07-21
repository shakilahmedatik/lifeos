## Why

LifeOS has a detailed specification but zero code. Before any module can be built,
the project needs a working full-stack skeleton: monorepo structure, dev servers,
TypeScript compilation, database connection, and the module folder template. This
scaffold proves the development environment works end-to-end and gives every
future module a consistent foundation to drop into.

## What Changes

- Initialize pnpm monorepo with workspaces (`backend/`, `frontend/`, `packages/`)
- Set up backend: Express + TypeScript (strict, ESM) + better-sqlite3 + Zod
- Set up frontend: Vite + React 19 + Tailwind CSS v4 + Biome
- Create shared database layer: SQLite connection (WAL mode, foreign keys) + versioned migration runner
- Create `packages/contracts` for shared API types between frontend and backend
- Create empty module folder structure following the hexagonal template (`domain/`, `application/`, `ports/`, `adapters/sqlite/`, `api/`)
- Wire composition root (`backend/src/index.ts`) with health endpoint
- Configure Vite proxy so frontend dev server can reach backend API
- Add `.env` for configuration (ports, database path)
- Add Biome for linting and formatting (replaces ESLint + Prettier)
- Add `.gitignore` for node_modules, dist, SQLite data file

## Capabilities

### New Capabilities

- `project-shell`: Monorepo structure, dev tooling, TypeScript config, database connection, migration runner, composition root, health check endpoint

### Modified Capabilities

_none — this is a greenfield scaffold_

## Impact

- **New files**: ~25 files across backend/, frontend/, packages/
- **Dependencies added**: express, better-sqlite3, zod, tsx (backend); react, react-dom, vite, @vitejs/plugin-react, tailwindcss (frontend); @biomejs/biome (root)
- **Dev commands**: `pnpm dev` starts both backend (tsx watch) and frontend (vite) concurrently
- **No existing code affected** — repo is empty except for the spec document
