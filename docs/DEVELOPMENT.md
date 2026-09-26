# Development Guide

Welcome to the LifeOS development guide. This document outlines the project's file structure, architectural patterns, and coding practices.

## File Structure

LifeOS is structured as a **monorepo** using `pnpm` workspaces.

```text
lifeos/
├── backend/                  # Node.js + Express + Drizzle backend
│   ├── src/
│   │   ├── modules/          # Domain-driven feature modules
│   │   ├── shared/           # Cross-cutting concerns (DB, logger, config)
│   │   └── index.ts          # Composition root & Express setup
├── frontend/                 # React + Vite + Tauri frontend
│   ├── src-tauri/            # Rust code for Tauri desktop shell
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── modules/          # Frontend feature modules (mirrors backend)
│   │   ├── lib/              # API clients, utilities
│   │   └── App.tsx           # Main application shell
├── packages/
│   └── contracts/            # Shared TypeScript types between frontend and backend
├── docs/                     # Project documentation and specs
├── biome.json                # Biome configuration for formatting/linting
├── package.json
└── pnpm-workspace.yaml
```

## Architectural Patterns

LifeOS uses a lightweight **Hexagonal Architecture (Ports and Adapters)** for its backend. This keeps business logic independent of frameworks and databases.

### Backend Module Structure
Each module in `backend/src/modules/<name>/` strictly follows this pattern:

1. **`domain/`**: Pure TypeScript types and functions. No database or Express imports allowed. Fully unit-testable.
2. **`ports/`**: TypeScript interfaces defining what the module needs from the outside world (e.g., `TaskRepository`).
3. **`application/`**: Use cases (services). Plain functions that receive ports (dependencies) as parameters. No concrete implementations.
4. **`adapters/`**: Concrete implementations of the ports (e.g., SQLite/Drizzle repositories). This is the only place `drizzle-orm` should be imported.
5. **`api/`**: Express routers. Handles HTTP requests, calls application use cases, and returns responses. No business logic here.

### Frontend Module Structure
The `frontend/src/modules/` directory roughly mirrors the backend modules. Each folder contains its own UI components, React hooks (using Tanstack Query), and local state management for that domain.

## Coding Practices

- **Strict TypeScript**: We use `strict: true` in our `tsconfig.json`. Avoid `any`; use `unknown` and Zod validation if you don't know a type.
- **Database**: We use **Drizzle ORM** with `@libsql/client` for Turso (SQLite).
  - Define your schema in `backend/src/shared/schema.ts` (or per-module if isolated).
  - Use `pnpm db:generate` to generate migrations.
  - Use `pnpm db:push` to apply changes directly (during dev).
- **Validation**: Use **Zod** at the API boundaries (both input validation on the backend and API response typing on the frontend).
- **Formatting and Linting**: We use **Biome**. Run `pnpm format` and `pnpm check` to ensure your code matches the project standards.
- **Styling**: Tailwind CSS v4. Avoid custom CSS unless absolutely necessary.
- **Dependency Injection**: No heavy DI frameworks (like Inversify or NestJS). We use simple constructor/function injection in the composition root (`backend/src/index.ts`).

## Adding a New Module

1. **Define the Types**: Start in `packages/contracts/` to define the shared entities, DTOs, and endpoints.
2. **Backend Domain**: Write pure business logic in `backend/src/modules/new_module/domain/`.
3. **Backend Ports**: Define the repository interface in `ports/`.
4. **Backend Application**: Write the use cases in `application/`.
5. **Database**: Create Drizzle schema and implement the repository in `adapters/sqlite/`.
6. **Backend API**: Expose the Express routes in `api/` and mount them in `backend/src/index.ts`.
7. **Frontend**: Build the UI components and data fetching hooks in `frontend/src/modules/new_module/`.

## Future Improvements & Next Phases

As documented in the Specification, future enhancements may include:
- **News/RSS Module**: Background fetching and aggregating curated feeds.
- **Charts & Analytics**: Integrating Recharts to visualize habit consistency, finance trends, and workout progress over time.
- **Tauri Polish**: Enhancing the native desktop experience with system tray integration, deep linking, and global shortcuts.
