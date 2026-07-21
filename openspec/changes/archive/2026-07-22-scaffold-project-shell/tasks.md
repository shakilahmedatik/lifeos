## 1. Root monorepo setup

- [x] 1.1 Initialize root `package.json` with `"type": "module"`, pnpm workspaces config (`pnpm-workspace.yaml`)
- [x] 1.2 Create `.gitignore` (node_modules, dist, backend/data/*.sqlite, .env)
- [x] 1.3 Create `.env` with `BACKEND_PORT=3000`, `FRONTEND_PORT=5173`, `DATABASE_PATH=./backend/data/lifeos.sqlite`
- [x] 1.4 Install Biome at root: `@biomejs/biome`, add `biome.json` config (formatter + linter enabled, indent with spaces, line width 100)
- [x] 1.5 Add root `package.json` scripts: `dev`, `biome check`, `biome format`

## 2. Backend setup

- [x] 2.1 Create `backend/package.json` with `"type": "module"`, dependencies: express, better-sqlite3, zod, dotenv, devDependencies: tsx, @types/express, @types/better-sqlite3, @types/node, typescript
- [x] 2.2 Create `backend/tsconfig.json` (strict: true, target: ES2022, module: Node16, moduleResolution: Node16, esModuleInterop: true, outDir: dist, rootDir: src)
- [x] 2.3 Create `backend/src/shared/db.ts`: connect to SQLite with `better-sqlite3`, enable WAL mode, enable foreign keys, create `schema_migrations` table if not exists
- [x] 2.4 Create `backend/src/shared/migrations/runner.ts`: read migration files from `migrations/` directory, check `schema_migrations` table, apply pending in order, record applied version
- [x] 2.5 Create `backend/src/shared/migrations/001_initial.sql` (empty placeholder — first real migration comes with Routine module)
- [x] 2.6 Create `backend/src/index.ts`: load dotenv, connect to database, run migrations, start Express on configured port, serve `GET /api/health` returning `{ status: "ok", port }`
- [x] 2.7 Create `backend/data/` directory and add `.gitkeep`

## 3. Frontend setup

- [x] 3.1 Create `frontend/package.json` with `"type": "module"`, dependencies: react, react-dom, devDependencies: @types/react, @types/react-dom, @vitejs/plugin-react, typescript, vite, tailwindcss
- [x] 3.2 Create `frontend/tsconfig.json` (strict: true, target: ES2020, module: ESNext, moduleResolution: bundler, jsx: react-jsx, esModuleInterop: true)
- [x] 3.3 Create `frontend/vite.config.ts`: react plugin, proxy `/api` to `http://localhost:${BACKEND_PORT}`
- [x] 3.4 Create `frontend/index.html` (minimal shell with root div, script tag pointing to src/main.tsx)
- [x] 3.5 Create `frontend/src/index.css` (Tailwind v4 import: `@import "tailwindcss"`)
- [x] 3.6 Create `frontend/src/main.tsx` (React 19 createRoot, render App)
- [x] 3.7 Create `frontend/src/App.tsx` (fetch `/api/health`, display "LifeOS — Connected" or "Disconnected" status)

## 4. Shared contracts

- [x] 4.1 Create `packages/contracts/package.json` with `"type": "module"`, name `@lifeos/contracts`
- [x] 4.2 Create `packages/contracts/tsconfig.json`
- [x] 4.3 Create `packages/contracts/src/index.ts` (placeholder export)

## 5. Module folder template

- [x] 5.1 Create `backend/src/modules/routine/` with subfolders: `domain/`, `application/`, `ports/`, `adapters/sqlite/`, `api/` — each with `.gitkeep`
- [x] 5.2 Create `backend/src/modules/dashboard/` with subfolders: `application/`, `ports/`, `adapters/sqlite/`, `api/` — each with `.gitkeep`
- [x] 5.3 Create `frontend/src/modules/routine/` with `.gitkeep`
- [x] 5.4 Create `frontend/src/modules/dashboard/` with `.gitkeep`

## 6. Verification

- [x] 6.1 Run `pnpm install` from root — all workspaces resolve, no errors
- [x] 6.2 Run `pnpm dev` — both backend and frontend start without errors
- [x] 6.3 Run `curl localhost:3000/api/health` — returns `{ status: "ok" }`
- [x] 6.4 Open `localhost:5173` — frontend loads, fetches health check, displays connection status
- [x] 6.5 Run `pnpm biome check` — zero errors
- [x] 6.6 Verify `backend/data/lifeos.sqlite` exists after backend start
