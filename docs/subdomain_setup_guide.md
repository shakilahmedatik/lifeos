# Step-by-Step Subdomain Setup Guide for `shatik.me`

This guide walks you through connecting:
- **Frontend**: `https://lifeos.shatik.me` -> Cloudflare Pages
- **Backend**: `https://api-lifeos.shatik.me` -> Vercel

---

## Part 1: Setup Frontend on Cloudflare Pages (`lifeos.shatik.me`)

### Step 1: Deploy Frontend to Cloudflare Pages
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation bar, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository (`lifeos`).
4. Set the Build Configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm --filter @lifeos/frontend build` (or `cd frontend && pnpm build`)
   - **Build output directory**: `frontend/dist`
5. Click **Save and Deploy**. Once completed, Cloudflare will give you a default URL like `lifeos-xyz.pages.dev`.

### Step 2: Attach Custom Subdomain (`lifeos.shatik.me`)
1. In your Cloudflare Pages project page, click on the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter `lifeos.shatik.me` and click **Continue**.
4. Cloudflare will automatically add the required `CNAME` record to your `shatik.me` DNS zone. Click **Activate domain**.

---

## Part 2: Setup Backend on Vercel (`api-lifeos.shatik.me`)

### Step 1: Deploy Backend to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your `lifeos` repository.
4. Set the Project Configuration:
   - **Root Directory**: `backend` (or leave default if monorepo root)
   - **Framework Preset**: `Other` / `Node.js`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `DATABASE_URL` = `libsql://lifeos-db-shakilahmedatik.aws-ap-south-1.turso.io`
   - `TURSO_DATABASE_TOKEN` = `<your_turso_token>`
   - `ALLOWED_ORIGINS` = `https://lifeos.shatik.me`
   - `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`
6. Click **Deploy**. Vercel will generate a default URL like `lifeos-backend.vercel.app`.

### Step 2: Attach Custom Domain on Vercel
1. In your Vercel project, go to **Settings** -> **Domains**.
2. Type `api-lifeos.shatik.me` into the input field and click **Add**.
3. Vercel will display the target CNAME value, which is usually:
   - **Name / Host**: `api-lifeos`
   - **Type**: `CNAME`
   - **Target / Value**: `cname.vercel-dns.com` (or your specific Vercel alias target)

---

## Part 3: Configure Cloudflare DNS for Backend Subdomain

1. Open your [Cloudflare Dashboard](https://dash.cloudflare.com/) and click on your domain `shatik.me`.
2. Go to **DNS** -> **Records**.
3. Click **Add record**:
   - **Type**: `CNAME`
   - **Name**: `api-lifeos`
   - **Target**: `cname.vercel-dns.com` (the target provided by Vercel in Part 2, Step 2)
   - **Proxy status**: **DNS only** *(Gray cloud icon)*  
     > [!IMPORTANT]  
     > Set Proxy status to **DNS only** (gray cloud) initially so Vercel can verify SSL certificate issuance smoothly.
4. Click **Save**.

---

## Part 4: Verify Domain SSL & Connectivity

1. Wait 1-2 minutes for DNS propagation and SSL issuance.
2. In Vercel Domains settings, you should see a green checkmark next to `api-lifeos.shatik.me`.
3. Test your backend in your browser:
   - Visit `https://api-lifeos.shatik.me/api/health`
   - You should see `{ "status": "ok" }`.
4. Test your frontend:
   - Visit `https://lifeos.shatik.me`

---

## Environment Variables Summary for Production

### Frontend (`frontend/.env` or Cloudflare Pages Env Vars)
```env
VITE_API_BASE_URL=https://api-lifeos.shatik.me
```

### Backend (`backend/.env` or Vercel Env Vars)
```env
ALLOWED_ORIGINS=https://lifeos.shatik.me
CLIENT_ORIGIN=https://lifeos.shatik.me
DATABASE_URL=libsql://lifeos-db-shakilahmedatik.aws-ap-south-1.turso.io
TURSO_DATABASE_TOKEN=...
QSTASH_URL=...
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
```
