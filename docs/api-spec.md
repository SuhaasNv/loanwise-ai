# API Specification

> Backend: FastAPI on Railway  
> Base URL: Configure via `VITE_API_URL` (defaults to `/api` — proxied to `http://localhost:8000` in local dev)

## Authentication

All endpoints except `/health`, `/user/setup`, `/user/role`, and `/user/setup-manager` send:

```
Authorization: Bearer <Clerk JWT>
X-User-Id: <Clerk user.id>
X-User-Role: <customer|manager>
```

When `CLERK_JWKS_URL` is configured on the backend the JWT is verified and `X-User-Role` is ignored (role is read from the DB). Without `CLERK_JWKS_URL` the backend runs in dev mode and trusts the headers.

Manager-protected endpoints respond with `403` if the caller's DB role is not `manager`.

## Error Format

```json
{
  "detail": "Error message"
}
```

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | None | Returns `{ "status": "ok", "version": "2.0.0" }` |

---

## User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/user/setup` | None | Assign a role. Managers must provide `managerSecret`. |
| GET | `/user/role` | None | Get stored role for a `?userId=` query param. |
| GET | `/user/setup-manager` | Secret in query | Dev-only: grant manager via `?userId=&secret=`. |

### `POST /user/setup` — Request

```json
{
  "userId": "user_2abc",
  "role": "manager",
  "managerSecret": "your-secret"
}
```

### `POST /user/setup` — Response

```json
{ "userId": "user_2abc", "role": "manager", "success": true }
```

### `GET /user/role` — Response

```json
{ "userId": "user_2abc", "role": "manager" }
```

---

## Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings` | Manager | Retrieve all settings key/value pairs. |
| PUT | `/settings` | Manager | Merge-update settings. |

### `PUT /settings` — Request

```json
{ "settings": { "autoProcessLoans": true, "riskThreshold": 0.6 } }
```

---

## Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Manager | Recent activity feed (new applications + completed decisions). |

---

## Loans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/loans` | None | List loans (`?page`, `?limit`, `?search`, `?decision`, `?userId`) |
| POST | `/loans` | None | Submit a new loan application (20/min rate limit) |
| GET | `/loans/:id` | None | Get single loan |
| PATCH | `/loans/:id` | Customer/Manager | Withdraw (customer own loan) or update manager notes |
| POST | `/loans/:id/process` | Manager | Trigger AI pipeline — runs in background, returns immediately |
| POST | `/loans/:id/decision` | Manager | Approve or deny after AI analysis (`status` must be `pending_review`) |
| GET | `/loans/:id/audit` | Manager | Full audit trail for a loan |
| GET | `/loans/export` | Manager | Export filtered loans as CSV (`?search`, `?decision`, `?format=csv`) |

### Loan status lifecycle

```
queued → processing → pending_review → completed
       → withdrawn (customer or manager)
       → error (pipeline failure)
```

### `POST /loans` — Request

```json
{
  "applicantName": "Sarah Chen",
  "applicantEmail": "sarah@example.com",
  "userId": "user_2abc",
  "income": 95000,
  "creditScore": 742,
  "loanAmount": 250000,
  "employmentType": "Full-time",
  "loanPurpose": "Home Purchase",
  "debtToIncomeRatio": 0.28
}
```

### `PATCH /loans/:id` — Request (withdrawal)

```json
{ "status": "withdrawn" }
```

### `PATCH /loans/:id` — Request (manager notes)

```json
{ "managerNotes": "Verified payslips on file." }
```

### `POST /loans/:id/decision` — Request

```json
{ "decision": "approved" }
```

`decision` must be `"approved"` or `"denied"`. Loan status must be `"pending_review"`.

### Loan Object

```json
{
  "id": "LN-001",
  "userId": "user_2abc",
  "applicantName": "Sarah Chen",
  "applicantEmail": "sarah@example.com",
  "income": 95000,
  "creditScore": 742,
  "loanAmount": 250000,
  "employmentType": "Full-time",
  "loanPurpose": "Home Purchase",
  "debtToIncomeRatio": 0.28,
  "applicationDate": "2026-03-12",
  "status": "completed",
  "decision": "approved",
  "aiRecommendation": "approved",
  "riskScore": 0.23,
  "approvalProbability": 0.77,
  "confidence": 0.94,
  "biasScore": 0.02,
  "toxicityScore": 0.01,
  "generatedEmail": "Dear Sarah...",
  "recommendations": [],
  "factors": [],
  "managerNotes": ""
}
```

### Audit Entry Object

```json
{
  "id": "AUD-001",
  "loanId": "LN-001",
  "userId": "user_2abc",
  "action": "submitted",
  "detail": "Application submitted for $250,000",
  "timestamp": "2026-03-12T14:30:00Z"
}
```

---

## AI — Standalone Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/loan/predict` | None | Run ML risk prediction (30/min rate limit) |
| POST | `/loan/email` | None | Generate AI customer email + bias/toxicity scores |
| POST | `/loan/recommendation` | None | Get product recommendations |
| POST | `/loan/bias-check` | None | Re-run bias & toxicity check on a given email text |

### `POST /loan/predict` — Request

```json
{
  "income": 95000,
  "creditScore": 742,
  "loanAmount": 250000,
  "employmentType": "Full-time",
  "loanPurpose": "Home Purchase",
  "debtToIncomeRatio": 0.28
}
```

### `POST /loan/predict` — Response

```json
{
  "riskScore": 0.23,
  "approvalProbability": 0.77,
  "decision": "approved",
  "confidence": 0.94
}
```

### `POST /loan/email` — Request

```json
{
  "loanId": "LN-001",
  "decision": "approved",
  "applicantName": "Sarah Chen",
  "loanAmount": 250000
}
```

### `POST /loan/email` — Response

```json
{
  "email": "Dear Sarah...",
  "biasScore": 0.02,
  "toxicityScore": 0.01
}
```

### `POST /loan/recommendation` — Request

```json
{
  "loanId": "LN-002",
  "applicantIncome": 68000,
  "creditScore": 615,
  "rejectionReason": "Low Credit Score"
}
```

### `POST /loan/recommendation` — Response

```json
{
  "recommendations": [
    {
      "productName": "SecureLine Personal Loan",
      "type": "Personal Loan",
      "rate": "7.5% APR",
      "description": "...",
      "matchScore": 92
    }
  ]
}
```

### `POST /loan/bias-check` — Request

```json
{ "email": "Dear Sarah...", "loanId": "LN-001" }
```

### `POST /loan/bias-check` — Response

```json
{
  "biasScore": 0.02,
  "toxicityScore": 0.01,
  "passed": true,
  "details": "No issues detected."
}
```

---

## Analytics

All analytics endpoints require **Manager** access.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics` | Manager | Full analytics bundle (stats + all series + recommendation metrics) |
| GET | `/analytics/stats` | Manager | Dashboard stats only |
| GET | `/analytics/approval-rate` | Manager | Approval rate trend data |
| GET | `/analytics/risk-distribution` | Manager | Risk score distribution |
| GET | `/analytics/agent-decisions` | Manager | Agent decisions per hour |
| GET | `/analytics/rejection-reasons` | Manager | Top rejection reason counts |
| GET | `/analytics/product-recommendations` | Manager | Product recommendation counts |
| GET | `/analytics/recommendation-metrics` | Manager | Total recs + average match score |

### Analytics Bundle Response

```json
{
  "stats": { "totalApplications": 47, "approvalRate": 68.3, "avgRiskScore": 0.34, "activeAgents": 4 },
  "approvalTrend": [{ "date": "Mar 1", "approved": 12, "denied": 5, "pending": 3 }],
  "riskDistribution": [{ "range": "0-0.2", "count": 18 }],
  "agentDecisions": [{ "hour": "9AM", "decisions": 12 }],
  "rejectionReasons": [{ "reason": "Low Credit Score", "count": 28 }],
  "productRecommendations": [{ "product": "Personal Loan", "count": 35 }],
  "recommendationAnalytics": { "totalRecommendations": 45, "avgMatchScore": 85.2 }
}
```

---

## Agents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/agents/logs` | Manager | Agent activity logs |

---

## Recommendations (Product Catalog)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/recommendations` | None | Available financial product catalog |

---

## TypeScript Types

See `src/types/` for TypeScript interfaces that match these schemas:

- `src/types/loan.ts` — `Loan`, `CreateLoanRequest`, `LoanPredictionRequest/Response`, `LoanEmailRequest/Response`, `LoanRecommendationRequest/Response`, `RiskFactor`, `Recommendation`
- `src/types/analytics.ts` — `DashboardStats`, `ApprovalTrendPoint`, `RiskDistributionPoint`, `AgentDecisionsPoint`, `RejectionReasonPoint`, `ProductRecommendationPoint`
- `src/types/agents.ts` — `AgentLog`, `BiasCheckRequest`, `BiasCheckResponse`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend base URL. Defaults to `/api` (proxied in dev). |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk frontend key. |
| `VITE_DEV_SKIP_AUTH` | Dev only | Skip Clerk sign-in enforcement. |
| `VITE_USE_MOCK_DATA` | Dev only | Use local fixture data instead of backend. |
| `CLERK_SECRET_KEY` | Production | Clerk server-side secret. |
| `CLERK_JWKS_URL` | Production | Clerk JWKS endpoint for JWT verification. Format: `https://<frontend-api>.clerk.accounts.dev/.well-known/jwks.json` |
| `MANAGER_SECRET` | Production | Secret required to claim manager role. |
| `ALLOWED_ORIGINS` | Production | Comma-separated CORS origins. |
| `ENVIRONMENT` | Production | Set to `production` to enforce strict checks. |
| `GOOGLE_API_KEY` | Optional | Enables Gemini AI pipeline. Falls back to heuristics if unset. |
