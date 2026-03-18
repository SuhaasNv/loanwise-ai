# LoanWise AI — Deployment Guide

This guide covers deploying the full stack (React frontend + FastAPI backend) to production. Choose one of the options below based on your preference.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables Reference](#environment-variables-reference)
3. [Option A: Railway (Full Stack)](#option-a-railway-full-stack)
4. [Option B: Vercel (Frontend) + Railway (Backend)](#option-b-vercel-frontend--railway-backend)
5. [Option C: Docker (Self-Hosted)](#option-c-docker-self-hosted)
6. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying, ensure you have:

| Item | Where to Get |
|------|--------------|
| **Clerk account** | [dashboard.clerk.com](https://dashboard.clerk.com) — create an application |
| **Google AI (Gemini) API key** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| **OpenAI API key** (optional fallback) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **GitHub repository** | Push your code to GitHub for connected deployments |

---

## Environment Variables Reference

### Frontend (build-time, baked into the bundle)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (`pk_live_*` for production) |
| `VITE_API_URL` | Yes (production) | Full URL of your backend API, e.g. `https://your-backend.railway.app` |
| `VITE_DEV_SKIP_AUTH` | No | Set to `true` only for local dev — **never** in production |
| `VITE_USE_MOCK_DATA` | No | Set to `true` only for local dev — **never** in production |

### Backend (runtime)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes (for AI) | Gemini API key |
| `OPENAI_API_KEY` | No | Fallback when Gemini fails |
| `CLERK_SECRET_KEY` | Yes (production) | Clerk secret key (`sk_live_*`) |
| `CLERK_JWKS_URL` | Yes (production) | `https://<your-clerk-frontend-api>.clerk.accounts.dev/.well-known/jwks.json` |
| `MANAGER_SECRET` | Yes (production) | Strong secret for claiming manager role — **must** differ from default |
| `ALLOWED_ORIGINS` | Yes (production) | Comma-separated frontend URLs, e.g. `https://yourapp.vercel.app,https://yourapp.com` |
| `ENVIRONMENT` | Yes (production) | Set to `production` to enforce security checks |

### Clerk JWKS URL

1. In [Clerk Dashboard](https://dashboard.clerk.com) → your application → **API Keys**
2. Find **Frontend API** (e.g. `https://your-app-123.clerk.accounts.dev`)
3. JWKS URL = `https://your-app-123.clerk.accounts.dev/.well-known/jwks.json`

---

## Option A: Railway (Full Stack)

Railway can host both the frontend and backend. The backend uses SQLite; on Railway the filesystem is ephemeral, so data resets on redeploy. For persistent data, add a Railway Volume or use an external DB later.

### 1. Deploy the Backend

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select your `loanwise-ai` repo.
3. Set the **Root Directory** to `backend` (or create a service that points to `backend`).
4. Railway will detect Python and use `railway.json` for the start command.
5. Add **Variables** (Settings → Variables):

   ```
   GOOGLE_API_KEY=your-gemini-key
   OPENAI_API_KEY=your-openai-key
   CLERK_SECRET_KEY=sk_live_xxxxx
   CLERK_JWKS_URL=https://xxxxx.clerk.accounts.dev/.well-known/jwks.json
   MANAGER_SECRET=your-strong-random-secret
   ALLOWED_ORIGINS=https://your-frontend.railway.app
   ENVIRONMENT=production
   ```

6. Deploy. Copy the public URL (e.g. `https://loanwise-backend-xxxx.up.railway.app`).

### 2. Deploy the Frontend

1. In the same Railway project, **Add Service** → **Deploy from GitHub**.
2. Set **Root Directory** to `.` (project root).
3. Override the build/start:

   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve dist -s -l 8080`
   - **Install:** Add `serve` to `devDependencies` in `package.json` if not present, or use `npx serve`.

4. Add **Variables**:

   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
   VITE_API_URL=https://loanwise-backend-xxxx.up.railway.app
   ```

5. Deploy. Copy the frontend URL.

### 3. Update CORS

In the backend service variables, set:

```
ALLOWED_ORIGINS=https://your-frontend-url.up.railway.app
```

Redeploy the backend if you change this.

---

## Option B: Vercel (Frontend) + Railway (Backend)

A common setup: Vercel for the React app, Railway for the API.

### 1. Deploy Backend to Railway

Follow **Option A, Step 1** above. Use your Vercel frontend URL in `ALLOWED_ORIGINS`:

```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import your GitHub repo.
3. **Framework Preset:** Vite.
4. **Root Directory:** `.`
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. **Environment Variables:**

   | Name | Value |
   |------|-------|
   | `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxx` |
   | `VITE_API_URL` | `https://your-backend.railway.app` |

8. Deploy.

### 3. Configure Clerk for Production

In Clerk Dashboard:

1. **Domains** → Add your Vercel domain (e.g. `your-app.vercel.app`).
2. Ensure **Sign-in** and **Sign-up** URLs use your production domain.

---

## Option C: Docker (Self-Hosted)

For VPS (DigitalOcean, Linode, AWS EC2, etc.) or Fly.io.

### 1. Create `Dockerfile` (backend)

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Create `Dockerfile` (frontend)

Create `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Create `nginx.conf`

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Note:** This assumes the backend container is named `backend`. Adjust for your orchestration (Docker Compose, Kubernetes, etc.).

### 4. Docker Compose Example

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - CLERK_JWKS_URL=${CLERK_JWKS_URL}
      - MANAGER_SECRET=${MANAGER_SECRET}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - ENVIRONMENT=production
    volumes:
      - loanwise_data:/app

  frontend:
    build:
      context: .
      args:
        VITE_CLERK_PUBLISHABLE_KEY: ${VITE_CLERK_PUBLISHABLE_KEY}
        VITE_API_URL: http://localhost:8000
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  loanwise_data:
```

For production, use a reverse proxy (Traefik, Caddy, nginx) in front and set `VITE_API_URL` to your public backend URL.

---

## Post-Deployment Checklist

- [ ] **Clerk:** Add production domain to allowed origins.
- [ ] **Backend:** `ENVIRONMENT=production` and `MANAGER_SECRET` is not the default.
- [ ] **Backend:** `CLERK_JWKS_URL` is set so JWT verification is enabled.
- [ ] **Backend:** `ALLOWED_ORIGINS` includes your frontend URL (no trailing slash).
- [ ] **Frontend:** `VITE_API_URL` points to the live backend (no trailing slash).
- [ ] **Frontend:** `VITE_DEV_SKIP_AUTH` and `VITE_USE_MOCK_DATA` are **not** set.
- [ ] **Manager access:** Visit `/claim-manager` and enter `MANAGER_SECRET` to grant yourself manager role.
- [ ] **Health check:** Open `https://your-backend/health` — should return `{"status":"ok"}`.

---

## Database Notes (SQLite)

The app uses SQLite by default. On platforms with ephemeral filesystems (Railway, Render, Heroku):

- Data is lost on each redeploy.
- For persistence, either:
  - Use a **Railway Volume** (or equivalent) mounted to the backend’s data directory, or
  - Migrate to **PostgreSQL** and update `database.py` to use a PostgreSQL driver (e.g. `psycopg2` or `asyncpg`).

For small demos or internal tools, ephemeral SQLite is acceptable.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Ensure `ALLOWED_ORIGINS` includes the exact frontend URL (protocol + domain, no path). |
| 401 on API calls | Set `CLERK_JWKS_URL`; ensure Clerk domain is configured for production. |
| 403 Manager access | Run `/claim-manager?userId=YOUR_CLERK_USER_ID&secret=MANAGER_SECRET` or use `/user/setup` with the correct secret. |
| Backend 500 on startup | Check `ENVIRONMENT=production` and that `MANAGER_SECRET` is not the default value. |
