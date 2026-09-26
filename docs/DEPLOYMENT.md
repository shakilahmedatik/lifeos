# LifeOS Deployment Guide

This guide covers how to deploy LifeOS in two different modes:
1. **Web / Cloud Deployment** (Frontend on Cloudflare Pages, Backend on Vercel, Database on Turso)
2. **Desktop / Native Application** (via Tauri)

---

## 1. Web / Cloud Deployment (Production)

This setup is ideal if you want to access LifeOS from any browser securely, with your data synced remotely.

### Prerequisites
- A domain name (e.g., `shatik.me`)
- Cloudflare account (for DNS and Pages)
- Vercel account (for Backend API)
- Turso account (for LibSQL / SQLite database)
- Upstash account (for QStash/Redis, if using background jobs or caching)

### Database Setup (Turso)
1. Log in to Turso and create a new database:
   ```bash
   turso db create lifeos-db
   ```
2. Get the database URL and an auth token:
   ```bash
   turso db show lifeos-db --url
   turso db tokens create lifeos-db
   ```
3. Push your Drizzle schema to the new database (from the `backend/` directory):
   ```bash
   export DATABASE_URL="libsql://<your-db-url>"
   export TURSO_DATABASE_TOKEN="<your-token>"
   pnpm db:push
   ```

### Backend Deployment (Vercel)
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Create a new Project and import your `lifeos` repository.
3. Configure the Project:
   - **Root Directory**: `backend`
   - **Framework Preset**: `Other` / `Node.js`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
4. Set Environment Variables:
   - `DATABASE_URL` = `libsql://<your-turso-url>`
   - `TURSO_DATABASE_TOKEN` = `<your-turso-token>`
   - `ALLOWED_ORIGINS` = `https://lifeos.yourdomain.com`
   - `CLIENT_ORIGIN` = `https://lifeos.yourdomain.com`
   - Add QStash tokens if applicable: `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`
5. Deploy and note down the backend URL or map a custom subdomain (e.g., `api.lifeos.yourdomain.com`).

### Frontend Deployment (Cloudflare Pages)
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select the `lifeos` repository.
4. Build Configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm --filter @lifeos/frontend build`
   - **Build output directory**: `frontend/dist`
5. Set Environment Variables:
   - `VITE_API_BASE_URL` = `https://api.lifeos.yourdomain.com`
6. Deploy and attach your custom domain (e.g., `lifeos.yourdomain.com`).

---

## 2. Desktop Application (Tauri)

LifeOS can be run as a native desktop application (macOS, Windows, Linux) using Tauri. This gives you an always-on window, native notifications, and local file access.

### Prerequisites
- Node.js & pnpm installed
- Rust toolchain installed (`rustup`)
- macOS: Xcode Command Line Tools (`xcode-select --install`)
- Windows: Visual Studio C++ Build Tools
- Linux: `webkit2gtk` and related dependencies

### Development Mode
To run the desktop app in development mode with hot-reloading:
```bash
# Start both backend and frontend, and then the Tauri window
pnpm tauri:dev
```
*(Make sure your backend is running locally and `VITE_API_BASE_URL` in `frontend/.env` points to your local backend, e.g., `http://localhost:3000`)*

### Building for Production
To build a production bundle (e.g., `.app` / `.dmg` for macOS, `.exe` for Windows):
```bash
# Inside the frontend/ directory
pnpm tauri build
```

This will create an optimized, standalone binary that includes the frontend UI. 

> **Note**: In a purely local-first Tauri build, the SQLite database is stored on the local file system. If you want it to sync with the cloud, ensure the desktop app points to the remote Turso database via environment variables.
