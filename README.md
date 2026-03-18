# LoanWise AI

<p align="center">
  <strong>AI-Powered Loan Origination Platform</strong>
</p>

<p align="center">
  An intelligent lending system that uses a multi-agent pipeline to evaluate loan applications, generate decision letters, detect bias, and recommend alternative products — with full explainability.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [AI Agents & Orchestration](#ai-agents--orchestration)
- [Risk Assessment Formulas](#risk-assessment-formulas)
- [Tech Stack](#tech-stack)
- [Security](#security)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [License](#license)

---

## Overview

LoanWise AI automates the loan decision workflow using **Google Gemini 2.5 Flash** and calibrated heuristics. The platform evaluates applications against CFPB, Fannie Mae conventional, and FHA guidelines; generates personalised decision letters; screens for discriminatory language; and suggests alternative products when applications are denied.

**Target users:** Risk analysts, loan underwriters, fintech operations teams, and lending startups.

---

## Key Features

| Feature | Description |
|--------|-------------|
| **Multi-step loan application** | Real-time validation, localStorage draft persistence, guided flow |
| **AI risk assessment** | RiskAssessor agent evaluates creditworthiness against industry guidelines |
| **Explainable AI** | Risk factors, contributions, and thresholds shown per decision |
| **Personalised decision letters** | EmailGenerator creates warm, professional correspondence |
| **Bias & toxicity detection** | BiasDetector screens all AI-generated emails per CFPB fair lending rules |
| **Product recommendations** | ProductRecommender suggests alternatives for denied applicants |
| **Manager dashboard** | Analytics, loan review, AI decisions, CSV export |
| **Role-based auth** | Customer / manager roles via Clerk JWT |

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LoanWise AI                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)          │  Backend (FastAPI)                        │
│  • Landing, Portal, Dashboard     │  • REST API, JWT auth                     │
│  • TanStack Query, shadcn/ui      │  • SQLite persistence                     │
│  • Clerk authentication          │  • Background task orchestration          │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI Agent Pipeline                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │ RiskAssessor │ → │EmailGenerator│ → │ BiasDetector │ → │ProductRecomm.│  │
│  │ (Gemini/     │   │ (Gemini/     │   │ (Gemini/     │   │ (Gemini/     │  │
│  │  Heuristic)  │   │  Template)   │   │  Heuristic)  │   │  Fallback)   │  │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Flow

```
Loan Application
       │
       ▼
┌──────────────────┐
│  RiskAssessor    │  Predicts risk score, approval probability, decision
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ProductRecommender│  (If denied) Suggests alternative products
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ EmailGenerator   │  Generates personalised decision letter
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ BiasDetector     │  Validates for discrimination/toxicity
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Manager Review   │  AI recommendation; manager approves or denies
└──────────────────┘
```

### Loan Status Lifecycle

```
queued → processing → pending_review → completed
       → withdrawn  (customer or manager)
       → error      (pipeline failure after retries)
```

---

## AI Agents & Orchestration

### Overview

The pipeline orchestrates **four specialised AI agents** in a fixed sequence. Each agent uses **Google Gemini 2.5 Flash** and has a **deterministic heuristic fallback** when the API is unavailable. There is no external queue (Redis, Celery) — orchestration is handled by **FastAPI** `BackgroundTasks` and a single Python `run_pipeline()` function.

---

### Agent 1: RiskAssessor

**Purpose:** Evaluates loan applications against CFPB, Fannie Mae conventional, and FHA guidelines; outputs risk score, approval probability, decision, and explainable factors.

| Input | Output |
|-------|--------|
| Income, credit score, loan amount, DTI, employment type, loan purpose | `riskScore`, `approvalProbability`, `decision`, `confidence`, `factors[]`, `reasoning` |

**Tools & capabilities:**

- **Gemini API** — Structured prompt with application details and industry guidelines; returns JSON with `riskScore`, `approvalProbability`, `decision`, `confidence`, `factors`, `reasoning` (4 factors: Credit Score, DTI, LTI, Employment Type)
- **Heuristic fallback** — Calibrated tier-based scoring (credit tiers, DTI tiers, LTI tiers, employment deltas); base risk 0.45 + contributions
- **Output validation** — Clamps `riskScore` and `approvalProbability` to `[0.04, 0.96]`; enforces `decision = approved` if `risk < 0.50`

---

### Agent 2: ProductRecommender

**Purpose:** Suggests alternative financial products for **denied** applicants. Runs only when RiskAssessor returns `denied`.

| Input | Output |
|-------|--------|
| Income, credit score, DTI, loan amount, loan purpose, denial factors | Product list with `matchScore` (0–100) and `reason` per product |

**Tools & capabilities:**

- **Gemini API** — Receives applicant profile and product catalog; scores each product by fit and returns JSON array
- **Product catalog** — Static list from `data.py` (`RECOMMENDATIONS_CATALOG`): Personal Loan, FHA Mortgage, Credit Card, Savings Plan, Auto Loan
- **Heuristic fallback** — Rule-based scoring (e.g. FHA +15 for credit ≥580 and DTI ≤50%; Credit Card +20 for credit <620)
- **Dynamic injection** — `_inject_smaller_loan()` adds a “Reduced Loan” offer when DTI is the main blocker (75% of requested amount, rounded to nearest $1k)

---

### Agent 3: EmailGenerator

**Purpose:** Writes a personalised, professional decision letter for the applicant.

| Input | Output |
|-------|--------|
| Applicant name, loan ID, decision, loan amount, factors, reasoning, optional recommendations | Plain-text email body (≤350 words) |

**Tools & capabilities:**

- **Gemini API** — Structured prompt with positive/negative factors, reasoning, and optional alternative products; generates warm, empathetic prose
- **Template fallback** — Jinja-style string templates for approval and denial; includes factor bullets and optional “Next Best Offer” section

---

### Agent 4: BiasDetector

**Purpose:** Screens generated emails for discriminatory or toxic language per CFPB fair lending rules.

| Input | Output |
|-------|--------|
| Generated email text, loan ID | `biasScore`, `toxicityScore`, `passed`, `explanation` |

**Tools & capabilities:**

- **Gemini API** — Compliance prompt; checks for protected class references, toxic language, vague denials, harsh tone; returns JSON
- **Heuristic fallback** — Keyword scan for protected terms (`race`, `religion`, `sex`, etc.) and toxic words (`terrible`, `pathetic`, etc.); `bias = min(hits × 0.05, 0.20)`, `toxicity = min(hits × 0.10, 0.30)`
- **Pass threshold** — `passed = true` only when both scores < 0.10

---

### Orchestration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Trigger: POST /loans/:id/process (Manager only)                             │
│  Backend: background_tasks.add_task(_run_pipeline_bg, loan_id, loan, user_id)│
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  _run_pipeline_bg() — Retry loop (up to 2 attempts, exponential backoff)     │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐
│  │  run_pipeline() — Sequential execution in pipeline.py                             │
│  │                                                                                  │
│  │  1. RiskAssessor   → risk_result (factors, decision, reasoning)                   │
│  │  2. ProductRecommender (if denied) → recommendations[]                            │
│  │  3. EmailGenerator → email_text (uses factors + recommendations)                 │
│  │  4. BiasDetector   → bias_score, toxicity_score, passed                          │
│  │                                                                                  │
│  │  Each step: insert_agent_log() → SQLite agent_logs table                          │
│  └─────────────────────────────────────────────────────────────────────────────────┘
│                                          │
│  Success → update loan: status=pending_review, aiRecommendation, factors, etc. │
│  Failure → update loan: status=error (after retries)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key orchestration details:**

| Aspect | Implementation |
|--------|----------------|
| **Trigger** | Manager triggers via `POST /loans/:id/process`; API returns immediately |
| **Execution** | FastAPI `BackgroundTasks`; no external queue (Redis, Celery) |
| **Retries** | Up to 2 attempts with exponential backoff (2s, 4s) |
| **State** | SQLite; loan status updated in-place; `agent_logs` table for audit trail |
| **Conditional logic** | ProductRecommender runs only when `decision == "denied"` |
| **Data flow** | RiskAssessor output → factors/reasoning fed to EmailGenerator; recommendations fed to EmailGenerator for denial letters |

---

### Tools & Dependencies Summary

| Component | Purpose |
|-----------|---------|
| **Google Gemini 2.5 Flash** | Primary LLM for all agent prompts; `generate_content()` with `temperature=0.2`, `max_output_tokens=2048` |
| **`google-genai` SDK** | Python client for Gemini API |
| **Heuristic fallbacks** | Deterministic Python functions when `GOOGLE_API_KEY` is unset or API fails |
| **SQLite** | `loans` table (application + pipeline results), `agent_logs` table (per-agent audit) |
| **`insert_agent_log()`** | Logs each agent action with timestamp, status, confidence, application ID |
| **`RECOMMENDATIONS_CATALOG`** | Product catalog from `data.py` |

---

### Standalone AI Endpoints

Each agent can also be invoked independently via REST endpoints (useful for testing or partial workflows):

| Endpoint | Agent | Description |
|----------|-------|--------------|
| `POST /loan/predict` | RiskAssessor | Risk prediction only |
| `POST /loan/email` | EmailGenerator | Generate email from decision + loan details |
| `POST /loan/bias-check` | BiasDetector | Re-check email for bias/toxicity |
| `POST /loan/recommendation` | ProductRecommender | Get product recommendations for denied profile |

---

## Risk Assessment Formulas

The RiskAssessor agent uses either **Gemini 2.5 Flash** or a **calibrated heuristic fallback**. Below are the formulas and thresholds used in the heuristic model.

### Core Metrics

#### Debt-to-Income Ratio (DTI)

$$
\text{DTI} = \frac{\text{Monthly Debt Payments}}{\text{Monthly Gross Income}}
$$

- Expressed as a decimal (e.g. `0.28` = 28%)
- **Preferred:** ≤ 36%
- **FHA limit:** ≤ 43%
- **High risk:** > 43%

#### Loan-to-Income Ratio (LTI)

$$
\text{LTI} = \frac{\text{Loan Amount}}{\text{Annual Income}}
$$

- **Conservative:** < 1.5×
- **Moderate:** 1.5× – 3×
- **Elevated:** 3× – 4.5×
- **High:** 4.5× – 6×
- **Very high:** > 6×

### Heuristic Risk Score

When Gemini is unavailable, risk is computed as:

$$
\text{riskScore} = 0.45 + \Delta_{\text{credit}} + \Delta_{\text{DTI}} + \Delta_{\text{LTI}} + \Delta_{\text{employment}}
$$

with contributions from each factor:

| Factor | Tier | Contribution (Δ) |
|--------|------|------------------|
| **Credit Score** | 800+ (Exceptional) | −0.22 |
| | 740–800 (Very Good) | −0.15 |
| | 670–740 (Good) | −0.06 |
| | 620–670 (Fair) | +0.10 |
| | 580–620 (Poor) | +0.20 |
| | < 580 (Very Poor) | +0.30 |
| **DTI** | 0–20% (Excellent) | −0.09 |
| | 20–28% (Good) | −0.04 |
| | 28–36% (Acceptable) | 0.00 |
| | 36–43% (Elevated) | +0.10 |
| | 43–50% (High) | +0.20 |
| | > 50% (Very High) | +0.32 |
| **LTI** | < 1.5× (Conservative) | −0.04 |
| | 1.5×–3× (Moderate) | 0.00 |
| | 3×–4.5× (Elevated) | +0.05 |
| | 4.5×–6× (High) | +0.12 |
| | > 6× (Very High) | +0.22 |
| **Employment** | Full-time | −0.03 |
| | Self-employed | +0.02 |
| | Contract | +0.04 |
| | Part-time | +0.10 |
| | Unemployed | +0.28 |

**Clamping:** `riskScore` is clamped to `[0.04, 0.96]`.

### Approval Probability

$$
\text{approvalProbability} = 1 - \text{riskScore}
$$

Also clamped to `[0.04, 0.96]`.

### Decision Rule

$$
\text{decision} = \begin{cases}
\text{approved} & \text{if } \text{riskScore} < 0.50 \\
\text{denied} & \text{if } \text{riskScore} \geq 0.50
\end{cases}
$$

### Confidence Score

$$
\text{confidence} = \min\left(0.99,\; 0.80 + 0.5 \cdot |\text{riskScore} - 0.50|\right)
$$

Higher margin from the 0.50 threshold increases confidence.

### Bias & Toxicity Detection

The BiasDetector screens generated emails for CFPB compliance:

$$
\text{passed} = (\text{biasScore} < 0.10) \land (\text{toxicityScore} < 0.10)
$$

- **biasScore:** 0 = no bias, 1 = severe bias (protected class references, vague denials)
- **toxicityScore:** 0 = no toxicity, 1 = extremely toxic

### Reduced Loan Offer (DTI Blocker)

When DTI is the main denial factor, a smaller loan may be suggested:

$$
\text{reducedAmount} = \text{round}\left(\frac{\text{loanAmount} \times 0.75}{1000}\right) \times 1000
$$

- **75% of requested amount**, rounded to nearest $1,000
- Minimum: $5,000
- Must be less than the original requested amount

---

## Security

LoanWise AI follows [OWASP API Security Top 10](https://owasp.org/API-Security/) guidelines. The hardening measures below are implemented in `backend/main.py` and `backend/database.py`.

### 1. Rate Limiting (per-route)

Every sensitive endpoint carries an individual rate limit enforced by [SlowAPI](https://github.com/laurentS/slowapi) on top of the global 200 req/min ceiling:

| Route | Limit |
|-------|-------|
| `POST /user/setup` | 5 / minute |
| `GET /user/role` | 30 / minute |
| `POST /loans` | 20 / minute |
| `PATCH /loans/:id` | 20 / minute |
| `POST /loans/:id/process` | 10 / minute |
| `POST /loans/:id/decision` | 10 / minute |
| `GET /loans/export` | 5 / minute |
| `GET /loans`, `GET /loans/:id` | 60 / minute |
| `POST /loan/predict` | 30 / minute |
| `POST /loan/email` | 10 / minute |
| `POST /loan/bias-check` | 10 / minute |
| `POST /loan/recommendation` | 10 / minute |
| `POST /loan/eligibility-check` | 20 / minute |
| `POST /loans/:id/documents` | 10 / minute |
| `GET /loans/:id/documents` | 30 / minute |
| `POST /recommendations/express-interest` | 10 / minute |
| `POST /contact` | 5 / minute |

Clients that breach a limit receive HTTP `429 Too Many Requests`.

### 2. Security Response Headers (middleware)

A `SecurityHeadersMiddleware` is injected for every API response:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |
| `Cache-Control` | `no-store` |

The `Server` response header is stripped to prevent version fingerprinting.

### 3. Row-Level Security (RLS)

SQLite has no native RLS, so it is enforced in `database.py` via two policy helpers:

```python
rls_loan(loan, user_id, role)      # managers see all; customers only own loans
rls_document(doc, user_id, role)   # same ownership rule for documents
```

A central `get_loan_scoped(loan_id, user_id, role)` function is called by **every** endpoint that reads a loan object. When a customer requests a loan that belongs to another user, the function returns `None` — which the handler responds to with HTTP `404` (not `403`) to prevent ID enumeration.

### 4. IDOR (Insecure Direct Object References) — Eliminated

| Endpoint | Vulnerability | Fix |
|----------|--------------|-----|
| `GET /loans/:id` | Customer could access any loan by ID | RLS via `get_loan_scoped` |
| `PATCH /loans/:id` | Ownership check bypassed for managerNotes field | RLS via `get_loan_scoped` |
| `POST /loans/:id/documents` | Any user could upload docs to foreign loan | RLS via `get_loan_scoped` |
| `GET /loans/:id/documents` | Any user could list docs on foreign loan | RLS via `get_loan_scoped` |
| `POST /recommendations/express-interest` | Any user could record interest against foreign `loanId` | Ownership verified before recording |
| `GET /user/role?userId=X` | Any user could enumerate roles of arbitrary users | Production: always scoped to JWT subject |
| `POST /user/setup` | Authenticated user could register a role for a different `userId` | JWT user must match body `userId`; mismatch returns HTTP `403` |

### 5. CORS — Tightened

In development the backend accepts `http://localhost:8080` and `http://localhost:5173`. In production set `ALLOWED_ORIGINS` to your exact domain(s). `allow_methods` and `allow_headers` are now explicit allow-lists instead of wildcards.

### 6. Authentication & Authorisation

- **JWT (RS256)** — All tokens issued by Clerk are verified against the JWKS endpoint when `CLERK_JWKS_URL` is set.
- **Role always from DB** — In production, user roles are looked up from SQLite on every request; the `X-User-Role` client header is never trusted.
- **Manager secret** — A server-side `MANAGER_SECRET` is required to claim manager role; the default value triggers a startup warning (and blocks startup entirely in `ENVIRONMENT=production`).

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11+, SQLite |
| **Auth** | Clerk |
| **AI** | Google Gemini 2.5 Flash (with heuristic fallback) |
| **State** | TanStack Query |
| **Testing** | Vitest, Playwright |

---

## Project Structure

```
loanwise-ai/
├── backend/                 # FastAPI backend
│   ├── main.py              # Routes, auth, validation, rate limiting
│   ├── database.py          # SQLite persistence
│   ├── pipeline.py          # AI agent pipeline (4 agents)
│   ├── data.py              # Seed data, product catalog
│   └── requirements.txt
├── src/
│   ├── pages/               # React pages
│   │   ├── LandingPage.tsx
│   │   ├── portal/          # Customer portal (applications, status)
│   │   └── (dashboard)      # Manager views
│   ├── components/          # Shared UI (RiskMeter, etc.)
│   ├── hooks/               # TanStack Query hooks
│   ├── lib/                 # API client, mock client
│   └── types/               # TypeScript types
├── docs/
│   ├── api-spec.md          # Full API reference
│   ├── agent-workflow.md    # Pipeline details
│   └── architecture.md     # System architecture
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **npm** (or pnpm/yarn)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd loanwise-ai
npm install
cd backend && pip install -r requirements.txt && cd ..
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` (frontend) and ensure `backend/.env` exists for the backend:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key ([dashboard.clerk.com](https://dashboard.clerk.com)) |
| `CLERK_SECRET_KEY` | Production | Clerk secret key |
| `GOOGLE_API_KEY` | Optional | Enables Gemini AI pipeline ([aistudio.google.com](https://aistudio.google.com/app/apikey)) |
| `MANAGER_SECRET` | Production | Secret to claim manager role (default dev: `loanwise-manager-2026`) |
| `CLERK_JWKS_URL` | Production | Clerk JWKS for JWT verification |

### 3. Run in development

```bash
npm run dev:all
```

Starts:

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:8000](http://localhost:8000)

### 4. Claim manager access

1. Sign up at `/sign-up`
2. Go to `/claim-manager`
3. Enter `MANAGER_SECRET` (default dev: `loanwise-manager-2026`)

### Mock mode (no backend)

Set `VITE_USE_MOCK_DATA=true` in `.env.local` to use local fixture data without the backend.

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_API_URL` | Backend base URL (default: proxied to `/api`) |
| `VITE_DEV_SKIP_AUTH` | Skip Clerk sign-in (dev only) |
| `VITE_USE_MOCK_DATA` | Use mock data instead of backend (dev only) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Enables Gemini AI pipeline |
| `CLERK_SECRET_KEY` | Clerk server-side secret |
| `CLERK_JWKS_URL` | JWT verification endpoint |
| `MANAGER_SECRET` | Secret for manager role claim |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `ENVIRONMENT` | `production` for strict checks |

---

## Deployment

See **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** for full deployment instructions. Options include:

- **Railway** — full stack (frontend + backend)
- **Vercel + Railway** — frontend on Vercel, backend on Railway
- **Docker** — self-hosted on VPS, Fly.io, etc.

**Production essentials:** Set `VITE_API_URL`, `CLERK_JWKS_URL`, `MANAGER_SECRET`, `ALLOWED_ORIGINS`, and `ENVIRONMENT=production`.

---

## API Documentation

Interactive docs are available at **http://localhost:8000/docs** when the backend is running.

See [`docs/api-spec.md`](docs/api-spec.md) for the full endpoint reference, including:

- Health, User, Settings, Notifications
- Loans (CRUD, process, decision, export)
- AI endpoints (predict, email, recommendation, bias-check)
- Analytics (stats, trends, agent logs)
- Recommendations catalog

---

## Running Tests

```bash
npm test              # Unit tests (Vitest)
npm run test:e2e      # End-to-end tests (Playwright)
```

---

## License

MIT
