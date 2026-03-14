# ADR 0001: Hybrid deployment (Vercel frontends + always-on backend)

## Status

Accepted

## Context

- `apps/user` is Next.js and deploys cleanly to Vercel.
- `apps/admin` is a Vite SPA and deploys cleanly to Vercel.
- `apps/backend` uses BullMQ workers and in-process interval scheduling, which require an always-on runtime.

## Decision

Adopt a hybrid deployment strategy:

- Deploy `apps/user` and `apps/admin` to Vercel.
- Deploy `apps/backend` to an always-on runtime (container/VM/service), with Postgres + Redis managed externally.

## Consequences

- CI/CD must handle 3 environments (`dev`, `qa`, `prd`) across multiple projects.
- Backend hosting choice can evolve independently without blocking frontend deployment.
- A future move to “backend on Vercel” requires a deliberate refactor.

