# LifeOS

> Personal productivity and life management system built with React 19, TypeScript, Express, and SQLite.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Express](https://img.shields.io/badge/Express-4.21-lightgrey)
![SQLite](https://img.shields.io/badge/SQLite-WAL-green)

## Tech Stack Overview

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4 | SPA client with modern dark cockpit theme |
| **Backend** | Node.js (ESM), Express 4.21, SQLite | RESTful API server with modular domain architecture |
| **Database** | SQLite (`better-sqlite3`) | Local WAL mode with automated SQL migrations |
| **Validation** | Zod 3.24 | Shared type boundary schemas across client and server |
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
┌──────────────┐     HTTP       ┌──────────────┐     WAL      ┌──────────────┐
│   Frontend   │ ─────────────▶ │   Backend    │ ──────────▶ │  lifeos.sqlite│
│  (React/Vite)│                │  (Express)   │             │  (SQLite)    │
└──────────────┘                └──────────────┘             └──────────────┘
            ▲                         │
            │                         │ imports
            │                         ▼
            │                ┌──────────────────────┐
            └────────────────│ packages/contracts   │
                             │ (shared interfaces)  │
                             └──────────────────────┘
```

## Module Inventory

- **Dashboard**: Central cockpit showing "Now" and "Next" tasks, habit completion toggles, and daily progress.
- **Routine**: Time-blocked task scheduling with status updates, overlap detection, and date filtering.
- **Habits**: Habit tracking with streaks, target counts, and weekly completion reviews.
- **Workouts**: Exercise library, custom workout routines, active session coach mode, and workout history.
- **Skills**: Learning session logs, course progress tracking, and skill category organization.
- **Finance**: Multi-account balances, income/expense categories, monthly financial summaries, and transaction logging.
- **News**: RSS feed aggregator, background fetching, and unread article digest.
- **Notifications**: Task reminder scheduling and background broadcaster notifications.

## Project Verification & Maintenance

```bash
# Format and lint codebase
pnpm check

# Run all unit test suites
pnpm test
```

## License

Personal project — open for reference and inspiration.
