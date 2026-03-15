# Agent Workflow

LangGraph orchestrates the loan decision pipeline.

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
└──────────────────┘
```

## Agent Details

| Agent | Input | Output |
|-------|-------|--------|
| Loan Risk | income, credit score, employment, loan amount | risk score, approval probability |
| Email Generation | decision, loan details | customer email text |
| Bias Detection | generated email | bias score, toxicity score, pass/fail |
| Recommendation | application, denial reason | alternative products |

## State

Agent state and job queues are persisted in Redis.
