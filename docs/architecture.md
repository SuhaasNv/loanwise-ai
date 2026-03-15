# System Architecture

## Frontend

React dashboard deployed on Vercel.

**Responsibilities:**

* UI
* data visualization
* loan management
* agent monitoring

---

## Backend

FastAPI service deployed on Railway.

**Responsibilities:**

* API endpoints
* ML inference
* AI agent orchestration
* authentication

---

## AI Layer

LangGraph manages multi-agent workflows.

**Agents:**

1. **Loan Risk Agent** — Predicts loan approval probability.
2. **Email Generation Agent** — Uses Gemini 2.5 Flash.
3. **Bias Detection Agent** — Detects discriminatory language.
4. **Recommendation Agent** — Suggests alternative financial products.

---

## Database

PostgreSQL stores:

* loan applications
* predictions
* analytics
* agent logs

---

## Cache

Redis stores:

* agent state
* job queues
