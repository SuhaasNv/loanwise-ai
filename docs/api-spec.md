# API Specification

> Backend: FastAPI on Railway  
> Base URL: Configure via `VITE_API_URL`

## Authentication

All endpoints (except `/health`) require `Authorization: Bearer <token>`.

## Error Format

```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "status_code": 400
}
```

---

## Loan

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/loans` | List loan applications (`?page`, `?limit`, `?search`, `?decision`) |
| GET | `/loans/:id` | Get single loan details |
| POST | `/loan/predict` | Run ML risk prediction |
| POST | `/loan/email` | Generate AI customer email (returns email + bias/toxicity scores) |
| POST | `/loan/recommendation` | Get next best offer recommendations |
| POST | `/loan/bias-check` | Re-run bias & toxicity check on a given email text |

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

---

## Analytics

The backend supports both a single bundle endpoint and individual sub-endpoints.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Full analytics bundle (stats + all series) |
| GET | `/analytics/stats` | Dashboard stats only |
| GET | `/analytics/approval-rate` | Approval rate trend data |
| GET | `/analytics/risk-distribution` | Risk score distribution |
| GET | `/analytics/agent-decisions` | Agent decisions per hour |
| GET | `/analytics/rejection-reasons` | Top rejection reason counts |
| GET | `/analytics/product-recommendations` | Product recommendation counts |

---

## Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents/logs` | Agent activity logs |

---

## Recommendations (Product Catalog)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommendations` | Available financial product catalog |

---

## TypeScript Types

See `src/types/` for TypeScript interfaces that match these schemas:
- `src/types/loan.ts` — Loan, LoanPrediction, LoanEmail, LoanRecommendation
- `src/types/analytics.ts` — DashboardStats, trend/distribution series
- `src/types/agents.ts` — AgentLog, BiasCheck
