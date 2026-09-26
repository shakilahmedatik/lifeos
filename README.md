# LifeOS

> Personal productivity and life management system built with React 19, TypeScript, Express, and SQLite.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey)
![SQLite](https://img.shields.io/badge/SQLite-WAL-green)

## Tech Stack Overview

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, React Router 7 | SPA client with modern dark cockpit theme |
| **Desktop App** | Tauri 2 | Native desktop application shell for macOS/Windows/Linux |
| **Backend** | Node.js (ESM), Express 4.21, Drizzle ORM | RESTful API server with modular domain architecture |
| **Database** | SQLite (`@libsql/client`), Turso | Remote (Turso) SQLite/LibSQL database or local file |
| **Auth** | Better-Auth | Authentication handling for web deployments |
| **Validation** | Zod 3.24 | Shared type boundary schemas across client and server |
| **State/Data** | Tanstack Query 5 | Client-side data fetching and state management |
| **Shared** | `@lifeos/contracts` | Monorepo contract package for domain entity interfaces |
| **Tooling** | pnpm, Biome 1.9, Vitest 4 | Fast monorepo management, linting, and unit testing |

## Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/shakilahmedatik/lifeos.git
cd lifeos

# 2. Install workspace dependencies
pnpm install

# 3. Create local environment configuration
cp .env.example .env

# 4. Start frontend and backend in development mode
pnpm dev
```

- Frontend SPA runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:3000`

## Architecture Overview

```
┌──────────────┐     HTTP       ┌──────────────┐     TCP/HTTP     ┌──────────────┐
│   Frontend   │ ─────────────▶ │   Backend    │ ───────────────▶ │ Turso SQLite │
│(React/Tauri) │                │  (Express)   │                  │ (Remote/Local)│
└──────────────┘                └──────────────┘                  └──────────────┘
            ▲                         │
            │                         │ imports
            │                         ▼
            │                ┌──────────────────────┐
            └────────────────│ packages/contracts   │
                             │ (shared interfaces)  │
                             └──────────────────────┘
```

The system supports two deployment modes:
1. **Local/Desktop Mode**: Tauri-based native app connecting to a local backend and local SQLite file.
2. **Web/Cloud Mode**: Frontend deployed on Cloudflare Pages, backend on Vercel, and database on Turso.

## Module Inventory

- **Dashboard**: Central cockpit showing "Now" and "Next" tasks, habit completion toggles, and daily progress.
- **Routine**: Time-blocked task scheduling with status updates, overlap detection, and date filtering.
- **Habits**: Habit tracking with streaks, target counts, and weekly completion reviews.
- **Workouts**: Exercise library, custom workout routines, active session coach mode, and workout history.
- **Skills**: Learning session logs, course progress tracking, and skill category organization.
- **Finance**: Multi-account balances, income/expense categories, monthly financial summaries, and transaction logging.
- **Health**: Health metrics tracking and summaries.
- **Auth & Profile**: User authentication (Better-Auth) and profile management for cloud sync.
- **Settings & Sync**: Application preferences and data synchronization settings.
- **News** (Planned): RSS feed aggregator, background fetching, and unread article digest.
- **Notifications**: Task reminder scheduling and background broadcaster notifications (with Tauri desktop integration).

## Project Verification & Maintenance

```bash
# Format and lint codebase
pnpm check

# Run all unit test suites
pnpm test
```

## License

Personal project — open for reference and inspiration.
