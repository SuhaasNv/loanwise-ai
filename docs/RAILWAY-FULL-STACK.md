# Deploy LoanWise AI to Railway (Full Stack)

Step-by-step guide to deploy both the frontend and backend on Railway.

---

## Before You Start

1. **Push your code to GitHub** — Railway deploys from your repo.
2. **Get your API keys:**
   - [Clerk](https://dashboard.clerk.com) → API Keys (use **production** keys: `pk_live_*`, `sk_live_*`)
   - [Google AI Studio](https://aistudio.google.com/app/apikey) → Gemini API key
   - [OpenAI](https://platform.openai.com/api-keys) → API key (optional fallback)
3. **Clerk JWKS URL:** In Clerk Dashboard → API Keys → copy **Frontend API** (e.g. `https://your-app.clerk.accounts.dev`). JWKS URL = `https://your-app.clerk.accounts.dev/.well-known/jwks.json`

---

## Part 1: Deploy the Backend

### Step 1: Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in with **GitHub**.
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Select your `loanwise-ai` repository (or connect GitHub if needed).
5. Railway will create a service. You’ll configure it next.

### Step 2: Configure the backend service

1. Click the new service to open it.
2. Go to **Settings**.
3. Under **Source**, set **Root Directory** to `backend`.
4. Under **Deploy**, Railway should auto-detect Python. The start command comes from `backend/railway.json`:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
   If you don’t see it, add this as the **Custom Start Command**.

### Step 3: Add backend environment variables

1. Go to **Variables** (or **Settings** → **Variables**).
2. Click **Add Variable** or **Raw Editor** and add:

   | Variable | Value |
   |----------|-------|
   | `GOOGLE_API_KEY` | Your Gemini API key |
   | `OPENAI_API_KEY` | Your OpenAI API key (optional) |
   | `CLERK_SECRET_KEY` | `sk_live_xxxxx` from Clerk |
   | `CLERK_JWKS_URL` | `https://YOUR-CLERK-FRONTEND-API.clerk.accounts.dev/.well-known/jwks.json` |
   | `MANAGER_SECRET` | A strong random string (e.g. from a password generator) |
   | `ALLOWED_ORIGINS` | `https://placeholder.railway.app` (you’ll update this after frontend deploy) |
   | `ENVIRONMENT` | `production` |

3. Save.

### Step 4: Generate a public URL

1. Go to **Settings** → **Networking** (or **Deployments**).
2. Click **Generate Domain**.
3. Copy the URL (e.g. `https://loanwise-ai-backend-production-xxxx.up.railway.app`).

### Step 5: Deploy

1. Click **Deploy** (or push a commit to trigger a deploy).
2. Wait for the build to finish.
3. Open `https://YOUR-BACKEND-URL/health` — you should see `{"status":"ok"}`.

**Save your backend URL** — you’ll need it for the frontend.

---

## Part 2: Deploy the Frontend

### Step 1: Add a new service

1. In the same Railway project, click **+ New**.
2. Select **GitHub Repo**.
3. Choose the same `loanwise-ai` repo.
4. A second service will be created.

### Step 2: Configure the frontend service

1. Click the new service.
2. Go to **Settings**.
3. Set **Root Directory** to `.` (project root; leave blank or use `.`).
4. Under **Build**:
   - **Build Command:** `npm install && npm run build`
   - Or leave default if Railway detects it.
5. Under **Deploy**:
   - **Start Command:** `npx serve dist -s -l 8080`
   - This serves the built Vite app. Railway uses `PORT`; if it fails, try `npx serve dist -s -l $PORT` or `npx serve dist -s`.

### Step 3: Add frontend environment variables

Frontend variables are used at **build time** (they get baked into the bundle).

1. Go to **Variables**.
2. Add:

   | Variable | Value |
   |----------|-------|
   | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxx` from Clerk |
   | `VITE_API_URL` | Your **backend URL** from Part 1 (e.g. `https://loanwise-ai-backend-production-xxxx.up.railway.app`) |

3. **Important:** Do **not** set `VITE_DEV_SKIP_AUTH` or `VITE_USE_MOCK_DATA` in production.

### Step 4: Generate a public URL

1. Go to **Settings** → **Networking**.
2. Click **Generate Domain**.
3. Copy the URL (e.g. `https://loanwise-ai-frontend-production-xxxx.up.railway.app`).

### Step 5: Deploy

1. Trigger a deploy (push a commit or click **Deploy**).
2. Wait for the build. The frontend should be live at the generated URL.

---

## Part 3: Connect Frontend and Backend (CORS)

1. Go back to the **backend** service.
2. Open **Variables**.
3. Update `ALLOWED_ORIGINS` to your **frontend URL**:
   ```
   https://loanwise-ai-frontend-production-xxxx.up.railway.app
   ```
   (Use the exact URL, no trailing slash.)
4. Save. Railway will redeploy the backend automatically.

---

## Part 4: Configure Clerk for Production

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → your application.
2. Open **Domains** (or **Paths**).
3. Add your Railway frontend domain (e.g. `loanwise-ai-frontend-production-xxxx.up.railway.app`).
4. If you use a custom domain, add that too.

---

## Part 5: Claim Manager Access

1. Open your frontend URL.
2. Sign up or sign in with Clerk.
3. Go to `/claim-manager`.
4. Enter your `MANAGER_SECRET` (the value you set in the backend variables).
5. You’ll be granted the manager role. Refresh and you should see the manager dashboard.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails with `bun install` | Ensure `package.json` has `"packageManager": "npm@10.2.0"` and `bun.lock` is removed. |
| CORS errors in browser | Set `ALLOWED_ORIGINS` to the exact frontend URL (no trailing slash). |
| 401 on API calls | Check `CLERK_JWKS_URL` and that your Clerk domain is added for production. |
| Frontend shows "Backend unreachable" | Verify `VITE_API_URL` matches the backend URL and the backend `/health` returns OK. |
| Backend won’t start | Ensure `MANAGER_SECRET` is not the default `loanwise-manager-2026` when `ENVIRONMENT=production`. |

---

## Optional: Add `serve` for Reliability

If `npx serve` causes issues, add `serve` as a dependency:

```bash
npm install --save-dev serve
```

Then set the start command to:

```
serve dist -s -l 8080
```

---

## Data Persistence Note

The backend uses SQLite. On Railway, the filesystem is ephemeral, so **data is lost on redeploy**. For persistent data:

- Add a **Railway Volume** and mount it to the backend’s data directory, or
- Migrate to PostgreSQL and update the backend to use it.
