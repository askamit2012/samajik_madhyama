# Deployment

This repo is a monorepo with three deployable apps:

- `apps/user` (Next.js) → Vercel
- `apps/admin` (Vite) → Vercel
- `apps/backend` (Express + workers) → Cloud Run (hybrid)

**Source of truth:** `deploy/strategy.yaml`

## Why hybrid?

The backend starts long-lived processes (BullMQ worker + interval schedulers). Those patterns do not map cleanly to Vercel Functions, which are short-lived and request-driven.

Cloud Run docs: `docs/deployment/cloud-run.md`

## Environments

We use branch-based environments:

- `dev` branch → Dev environment
- `qa` branch → QA environment
- `prd` branch → Production environment

See `docs/deployment/environments.md`.
