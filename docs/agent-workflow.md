# Agent Workflow

The loan decision pipeline is implemented in `backend/pipeline.py`. Each agent calls Google Gemini 2.5 Flash with a structured prompt and falls back to calibrated heuristics when the API is unavailable.

## Flow

```
Loan Application
       │
       ▼
┌──────────────────┐
│ Loan Risk Agent  │  Predicts approval probability
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Email Generation │  Gemini 2.5 Flash generates customer email
│     Agent        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Bias Detection   │  Validates for discrimination/toxicity
│     Agent        │  Blocks if score exceeds threshold
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Recommendation   │  If denied: suggests alternative products
│     Agent        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Manager Review   │  AI recommendation presented; manager approves or denies
└──────────────────┘
```

## Agent Details

| Agent | Input | Output |
|-------|-------|--------|
| Loan Risk | income, credit score, employment, loan amount, DTI | risk score, approval probability, factors |
| Email Generation | decision, loan details | customer email text |
| Bias Detection | generated email | bias score, toxicity score, pass/fail |
| Recommendation | application, denial reason | alternative products |

## Implementation Notes

- **Runtime**: FastAPI background tasks (`BackgroundTasks`) — no external queue required.
- **AI model**: Google Gemini 2.5 Flash via `google-genai` SDK. Set `GOOGLE_API_KEY` in `backend/.env`.
- **Fallback**: Each agent has deterministic heuristics when Gemini is unavailable.
- **Persistence**: Agent logs stored in SQLite `agent_logs` table; results persisted in `loans` table.
- **Retries**: Pipeline retries up to 2 times with exponential back-off on transient failures before setting `status="error"`.
- **State**: No external Redis or LangGraph required. SQLite + FastAPI background tasks handle orchestration.

## Loan Status Lifecycle

```
queued → processing → pending_review → completed
       → withdrawn  (customer or manager)
       → error      (pipeline failure after retries)
```
