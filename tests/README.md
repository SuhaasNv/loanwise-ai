# Tests

## Structure

```
tests/
├── integration/   # API integration tests (Vitest)
│   └── api.test.ts
└── e2e/           # End-to-end tests (Playwright)
    └── example.spec.ts
```

## Running Tests

**Integration tests** (API client, mocked fetch):

```bash
npm run test
```

**E2E tests** (requires app running on port 8080):

```bash
npm run dev          # Start app in another terminal
npm run test:e2e     # Run Playwright tests
```
