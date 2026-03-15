# Frontend Guidelines

## Stack

* React 18
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query

## Structure

```
src/
├── components/     # Reusable UI components
│   └── ui/         # shadcn primitives
├── hooks/          # Custom hooks, data fetching
├── lib/            # API client, utilities
├── pages/          # Route-level components
└── types/          # TypeScript interfaces
```

## Data Fetching

* Use TanStack Query for all API calls
* Do not call `fetch` directly in components
* Use the API client in `src/lib/api-client.ts`

## Components

* Prefer functional components
* Keep components small and focused
* Reuse shadcn/ui primitives
* Extract repeated patterns into shared components

## Styling

* Tailwind CSS for styling
* Use design tokens (CSS variables) for colors, spacing
* Follow existing patterns in `index.css`

## TypeScript

* Strict mode enabled
* No `any` — use proper types
* API response types must match backend

## See Also

* [AI Agent Instructions](./ai-agent-instructions.md)
* [PRD](./prd.md)
