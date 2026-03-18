# Deploying LoanWise AI to Railway & Vercel

> **Security:** Never commit `.env`, `.env.local`, `backend/.env`, or `loanwise.db` to Git. These are in `.gitignore`. Use Railway/Vercel dashboard for production secrets.

This guide walks you through hosting **LoanWise AI** with:
- **Backend (FastAPI)** → Railway
- **Frontend (React/Vite)** → Vercel

---

## Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│  Vercel (Frontend)   │  ────►  │  Railway (Backend)   │
│  React + Vite SPA    │  API    │  FastAPI + SQLite    │
│  *.vercel.app        │  calls  │  *.up.railway.app   │
└─────────────────────┘         └─────────────────────┘
```

---

## Part 1: Deploy Backend to Railway

### 1. Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in (GitHub recommended).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your `loanwise-ai` repository.
4. Railway will create a new service.

### 2. Configure the Backend Service

1. In your Railway project, click the service.
2. Go to **Settings** → **General**.
3. Set **Root Directory** to `backend`.
4. Railway will auto-detect Python from `requirements.txt` and use the `Procfile` or `railway.json` for the start command.

### 3. Add Environment Variables

Go to **Variables** and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes (for AI) | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | Optional | Fallback when Gemini is unavailable |
| `CLERK_SECRET_KEY` | Production | From [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_JWKS_URL` | Production | `https://<your-frontend-api>.clerk.accounts.dev/.well-known/jwks.json` |
| `MANAGER_SECRET` | Production | Strong secret for manager role claim (e.g. random 32+ chars) |
| `ALLOWED_ORIGINS` | Production | Comma-separated: `https://yourapp.vercel.app,https://yourapp.vercel.app` |
| `ENVIRONMENT` | Production | Set to `production` |

**Example `ALLOWED_ORIGINS`** (replace with your Vercel URL):
```
https://loanwise-ai.vercel.app,https://your-custom-domain.com
```

### 4. Deploy and Get the URL

1. Railway will build and deploy automatically.
2. Go to **Settings** → **Networking** → **Generate Domain**.
3. Copy the URL (e.g. `https://loanwise-ai-backend.up.railway.app`).

### 5. SQLite & Data Persistence

⚠️ **Important:** Railway uses an **ephemeral filesystem**. SQLite data is lost on each redeploy.

- For **development/demo**: This is acceptable; the app will work but data resets on deploy.
- For **production**: Add a **PostgreSQL** database in Railway and migrate your backend to use it (requires code changes).

---

## Part 2: Deploy Frontend to Vercel

### 1. Create a Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. Click **Add New** → **Project**.
3. Import your `loanwise-ai` repository.
4. Vercel will auto-detect Vite.

### 2. Configure Build Settings

- **Framework Preset:** Vite
- **Build Command:** `npm run build` (default)
- **Output Directory:** `dist` (default)
- **Root Directory:** `./` (leave empty)

### 3. Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | `https://your-railway-backend.up.railway.app` | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Yes |

**Do not set** in production:
- `VITE_USE_MOCK_DATA` (leave unset or `false`)
- `VITE_DEV_SKIP_AUTH` (leave unset or `false`)

**⚠️ Important:** `VITE_API_URL` must be set **before** the first build. Redeploy after adding it if it was missing.

### 4. Deploy

1. Click **Deploy**.
2. Vercel will build and give you a URL like `https://loanwise-ai.vercel.app`.

---

## Part 3: Post-Deploy Configuration

### 1. Update Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Domains**.
2. Add your Vercel domain (e.g. `loanwise-ai.vercel.app`).
3. Ensure your **Production** instance uses the correct domain.

### 2. Update Railway CORS

In Railway **Variables**, set `ALLOWED_ORIGINS` to include your Vercel URL:

```
https://loanwise-ai.vercel.app,https://www.loanwise-ai.vercel.app
```

### 3. Redeploy

- **Railway:** Redeploy after changing `ALLOWED_ORIGINS`.
- **Vercel:** Redeploy after changing `VITE_API_URL` (env vars are baked in at build time).

---

## Quick Reference

### Railway (Backend)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Vercel (Frontend)

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Framework | Vite |

### Environment Variables

| Where | Variable | Required |
|-------|-----------|----------|
| Railway | `GOOGLE_API_KEY` | Yes (for AI) |
| Railway | `MANAGER_SECRET` | Yes (production) |
| Railway | `CLERK_JWKS_URL` | Yes (production) |
| Railway | `CLERK_SECRET_KEY` | Yes (production) |
| Railway | `ALLOWED_ORIGINS` | Yes (Vercel URL) |
| Railway | `ENVIRONMENT` | `production` |
| Vercel | `VITE_API_URL` | Yes (Railway URL) |
| Vercel | `VITE_CLERK_PUBLISHABLE_KEY` | Yes |

---

## Troubleshooting

### CORS errors

- Ensure `ALLOWED_ORIGINS` on Railway includes your Vercel URL exactly (with `https://`, no trailing slash).
- Use comma-separated values for multiple origins.

### "Backend unreachable"

- Check `VITE_API_URL` is set correctly (no trailing slash).
- Ensure Railway service is running and the domain is generated.
- Visit `https://your-railway-url.up.railway.app/health` directly to verify.

### 401 Unauthorized

- Ensure `CLERK_JWKS_URL` is set on Railway.
- Add your Vercel domain to Clerk allowed domains

### MANAGER_SECRET startup failure

- In production, `MANAGER_SECRET` cannot be the default `loanwise-manager-2026`.
- Generate a strong secret (e.g. `openssl rand -hex 32`) and set it in Railway.
