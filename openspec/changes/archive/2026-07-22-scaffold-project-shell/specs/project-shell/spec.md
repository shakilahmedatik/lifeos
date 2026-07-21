## ADDED Requirements

### Requirement: Monorepo structure
The project SHALL be organized as a pnpm workspace monorepo with three workspace
packages: `backend/`, `frontend/`, and `packages/contracts/`.

#### Scenario: Workspace resolution
- **WHEN** `pnpm install` is run from the repository root
- **THEN** all workspace dependencies are installed and `pnpm:workspace:*` protocols resolve correctly

### Requirement: Backend dev server
The backend SHALL execute TypeScript directly via `tsx watch` with no compilation
step during development. The backend SHALL start on the port defined in `.env`
(default 3000).

#### Scenario: Hot reload
- **WHEN** a TypeScript file in `backend/src/` is modified
- **THEN** the backend restarts automatically within 2 seconds

#### Scenario: Health check
- **WHEN** a GET request is made to `/api/health`
- **THEN** the backend returns `{ status: "ok" }` with the configured port

### Requirement: Frontend dev server
The frontend SHALL run via Vite dev server. The frontend SHALL proxy all `/api`
requests to the backend port defined in `.env`.

#### Scenario: API proxy
- **WHEN** the frontend fetches `/api/health`
- **THEN** the request is proxied to the backend and the response is displayed

### Requirement: SQLite database layer
The backend SHALL connect to SQLite via better-sqlite3 with WAL mode and foreign
keys enabled. The database file path SHALL be read from `.env`.

#### Scenario: Database creation
- **WHEN** the backend starts for the first time
- **THEN** the SQLite file is created at the configured path

#### Scenario: Migration runner
- **WHEN** the backend starts
- **THEN** the `schema_migrations` table is created if it does not exist and
  pending migrations are applied in order

### Requirement: Shared contracts package
The `packages/contracts/` package SHALL export TypeScript types shared between
backend and frontend. Both packages SHALL reference it via `pnpm:workspace:*`.

#### Scenario: Type import
- **WHEN** the backend imports a type from `@lifeos/contracts`
- **THEN** the import resolves to the local workspace package

### Requirement: Module folder template
Empty module folders SHALL follow the hexagonal template: `domain/`, `application/`,
`ports/`, `adapters/sqlite/`, `api/`. Each folder SHALL contain a `.gitkeep` or
placeholder file.

#### Scenario: Folder existence
- **WHEN** the scaffold is complete
- **THEN** `backend/src/modules/routine/` and `backend/src/modules/dashboard/`
  each contain the full subfolder structure

### Requirement: Biome linting and formatting
Biome SHALL be configured at the repository root for both linting and formatting.
All TypeScript and JavaScript files SHALL pass `biome check` with zero errors.

#### Scenario: Lint pass
- **WHEN** `pnpm biome check` is run from the root
- **THEN** no errors or warnings are reported

### Requirement: Environment configuration
A `.env` file SHALL define backend port, frontend port, and database path. Both
backend and frontend SHALL read their configuration from environment variables.

#### Scenario: Custom port
- **WHEN** `.env` sets `BACKEND_PORT=4000`
- **THEN** the backend starts on port 4000 and the frontend proxies to 4000
