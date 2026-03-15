# AI Agent Instructions

This repository uses AI coding tools such as Cursor, Claude, and GPT for development.

All AI agents must follow these project conventions.

---

# Project Overview

This project is an AI fintech platform called:

**Agentic Loan Intelligence Platform**

It automates loan decision workflows using machine learning and AI agents.

---

# Tech Stack

**Frontend:**
* React
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query

**Backend:**
* FastAPI
* Python
* LangGraph

**LLM:**
* Gemini 2.5 Flash

**Database:**
* PostgreSQL

**Infrastructure:**
* Frontend: Vercel
* Backend: Railway
* Cache: Redis

---

# Coding Guidelines

## Frontend

Follow these rules:

* Use TypeScript strict mode
* Prefer functional components
* Use TanStack Query for data fetching
* Avoid direct fetch calls in components
* Use API client in src/lib/api-client.ts
* Keep components small and reusable

**Folder structure:**

```
src/
  components/
  hooks/
  lib/
  pages/
  types/
```

---

## API Layer

All API calls must go through the API client.

Example:

```ts
apiClient('/loans')
```

Do not call fetch directly inside components.

---

## State Management

Prefer local state.

Use Zustand only if global state is necessary.

---

## Error Handling

All network requests must handle errors.

Use TanStack Query error boundaries where possible.

---

## Security

Never expose:

* API keys
* private tokens
* LLM configuration

These must be handled in the backend.

---

## Code Quality

* No implicit any
* Strong typing required
* Avoid duplicated components
* Reuse UI primitives

---

# Pull Request Rules

Before merging:

* code must compile
* no TypeScript errors
* lint must pass
* API types must match backend

---

# AI Agent Behavior

When generating code:

1. Always read PRD.md
2. Follow project structure
3. Use existing components
4. Avoid creating duplicate patterns
5. Write strongly typed code
