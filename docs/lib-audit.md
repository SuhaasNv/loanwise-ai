# Audit: `src/lib/` — API Layer

> Audit date: 2026-03-16  
> Scope: `api-client.ts`, `mock-client.ts`, `mock-data.ts`, `api/*` modules

---

## 1. API Abstraction

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Components / Hooks                                             │
│  (ClaimManagerPage, useUserRole, pages using api/*)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────┐
│ api/loans.ts  │   │ api/analytics │   │ api/agents.ts      │
│ api/analytics │   │ (settings too) │   │                    │
└───────┬───────┘   └───────┬───────┘   └─────────┬─────────┘
        │                   │                     │
        └───────────────────┼─────────────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ api-client.ts        │
                 │ apiClient() / apiFetch│
                 └──────────┬───────────┘
                            │
              ┌─────────────┴─────────────┐
              │ VITE_USE_MOCK_DATA=true?  │
              └─────────────┬─────────────┘
                    │               │
                    ▼               ▼
           mock-client.ts      fetch(API_BASE + endpoint)
           mockInterceptor    (real backend)
           mockApiFetch
```

### Abstraction Layers

| Layer | Responsibility |
|-------|----------------|
| **api-client.ts** | Low-level: `apiClient<T>()` (JSON), `apiFetch()` (raw Response), auth headers, token/user context, `ApiError` |
| **api/*.ts** | Domain helpers: typed functions per endpoint (e.g. `getLoans`, `submitDecision`) |
| **mock-client.ts** | Intercepts requests when `VITE_USE_MOCK_DATA=true`, returns fixture data |

### Inconsistencies

1. **No `api/user.ts`** — `/user/setup` and `/user/role` are called directly via `apiClient` from:
   - `ClaimManagerPage.tsx` → `apiClient("/user/setup", ...)`
   - `useUserRole.ts` → `apiClient<UserRoleResponse>("/user/role?userId=...")`
   - `UserRoleResponse` is defined inline in the hook, not in `src/types/`

2. **Settings in analytics module** — `getSettings()` and `saveSettings()` live in `api/analytics.ts` but are settings endpoints, not analytics. Consider `api/settings.ts` or `api/user.ts`.

3. **Local type definitions** — `loans.ts` defines `AuditEntry` and `Notification` locally instead of in `src/types/`.

---

## 2. Types

### Type Locations

| Domain | Types File | Used By |
|--------|------------|---------|
| Loans, predictions, recommendations | `src/types/loan.ts` | `api/loans.ts`, `api/agents.ts` |
| Analytics | `src/types/analytics.ts` | `api/analytics.ts` |
| Agents | `src/types/agents.ts` | `api/agents.ts` |

### Duplication: mock-data.ts vs src/types

`mock-data.ts` defines interfaces that overlap with `src/types/`:

| mock-data.ts | src/types | Notes |
|--------------|-----------|-------|
| `LoanApplication` | `Loan` (loan.ts) | Nearly identical; `LoanApplication` has `managerNotes`, `Loan` does not |
| `AgentLog` | `AgentLog` (agents.ts) | Same shape |
| `Recommendation` | `Recommendation` (loan.ts) | Same shape; mock-data version lacks `reason?` |
| `BiasDetection` | — | No equivalent in types; `BiasCheckResponse` in agents.ts is different |

**Recommendation:** Use `Loan` from `types/loan.ts` in mock-data (or a shared base type). Add `managerNotes` to `Loan` to match API spec.

### Missing / Mismatched Types

- **`Loan`** — Missing `managerNotes?: string` (present in API spec and used by `updateManagerNotes`).
- **`UserRoleResponse`** — Defined inline in `useUserRole.ts`; should live in `src/types/user.ts` if a user module is added.
- **Settings** — `Record<string, unknown>`; no dedicated `Settings` interface.

---

## 3. Error Handling

### api-client.ts

- **Non-2xx responses:** Throws `ApiError(status, message)`.
- **Message extraction:** Tries `res.json()`, uses `err.message` or `err.detail` or `res.statusText`.
- **JSON parse failure:** Falls back to `statusText`.

```ts
// api-client.ts:59-68
if (!res.ok) {
  let message = res.statusText;
  try {
    const err = await res.json();
    message = err.message || err.detail || message;
  } catch { /* use statusText */ }
  throw new ApiError(res.status, `API Error ${res.status}: ${message}`);
}
```

### api/* modules

- Do **not** catch or transform errors.
- `ApiError` propagates to callers.

### Callers

- **ClaimManagerPage:** Catches, uses `err instanceof Error ? err.message : "Invalid secret or server error."`
- **React Query:** Errors surface via `error` in query result; components handle as needed.

### Mock Mode

- **apiClient:** `mockInterceptor` returns `null` for unknown routes → falls through to real fetch. No special error handling.
- **apiFetch:** If `mockApiFetch` returns `null`, **throws** `Error("apiFetch: no mock registered for ...")` — does **not** fall through to real fetch.

---

## 4. Mock vs Real Switching

### Toggle

```ts
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === "true";
```

- Env var must be exactly `"true"` (string).
- No runtime override; build-time only.

### apiClient Flow

```
USE_MOCK?
  YES → mockInterceptor(endpoint, options)
        → if result !== null: return result
        → else: fall through to real fetch
  NO  → real fetch
```

- Unknown mock routes fall through to real backend.
- Mock and real can be mixed (e.g. mock some endpoints, real others).

### apiFetch Flow

```
USE_MOCK?
  YES → mockApiFetch(endpoint, options)
        → if result !== null: return result
        → else: THROW Error("apiFetch: no mock registered for ...")
  NO  → real fetch
```

- **Inconsistency:** `apiFetch` throws when no mock is registered; `apiClient` falls through. Only `apiFetch` is used for `/loans/export` (CSV), so in mock mode that endpoint works. If a future `apiFetch` call had no mock, it would fail instead of hitting the real backend.

### Mock Coverage

| Endpoint | mockInterceptor | mockApiFetch |
|----------|-----------------|--------------|
| `/user/setup`, `/user/role` | ✓ | — |
| `/settings` | ✓ | — |
| `/notifications` | ✓ | — |
| `/loans`, `/loans/:id`, etc. | ✓ | — |
| `/loans/export` | — | ✓ |
| `/loan/predict`, `/loan/email`, etc. | ✓ | — |
| `/analytics`, `/analytics/*` | ✓ | — |
| `/agents/logs` | ✓ | — |
| `/recommendations` | ✓ | — |

### Mock Implementation Notes

- **Shared mutable state:** `mockLoanApplications` is mutated by POST/PATCH/POST process/decision. State persists across "requests" in a session.
- **Path parsing:** Uses `path.split("?")[0]` and regex for dynamic segments; generally consistent with API spec.
- **Delay:** 400ms (mockInterceptor), 200ms (mockApiFetch) to simulate latency.

---

## 5. Inconsistencies Summary

| # | Issue | Severity |
|---|-------|----------|
| 1 | `apiFetch` throws when no mock; `apiClient` falls through | Medium |
| 2 | No `api/user.ts`; user endpoints called directly | Low |
| 3 | Settings in `api/analytics.ts` (domain mismatch) | Low |
| 4 | Duplicate types in mock-data.ts vs src/types | Medium |
| 5 | `Loan` type missing `managerNotes` | Low |
| 6 | `AuditEntry`, `Notification` defined in loans.ts instead of types | Low |
| 7 | `UserRoleResponse` inline in hook | Low |
| 8 | `apiFetch` always sets `Content-Type: application/json` only when `hasBody`; `apiClient` always sets it | — (intentional for GET) |

---

## 6. Recommendations

1. **Unify mock fallback:** Either make `apiFetch` fall through to real fetch when mock returns `null`, or document that `apiFetch` requires mocks for all used endpoints in mock mode.
2. **Add `api/user.ts`:** Extract `setupUser`, `getUserRole` (or similar) and move `UserRoleResponse` to `src/types/user.ts`.
3. **Move settings:** Create `api/settings.ts` or consolidate with user API.
4. **Consolidate types:** Use `Loan` from types in mock-data; add `managerNotes` to `Loan`; move `AuditEntry` and `Notification` to `src/types/`.
5. **Document mock behaviour:** Add a short note in api-client or mock-client describing fallback behaviour for developers.
