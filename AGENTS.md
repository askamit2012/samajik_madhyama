## Deployment strategy (read first)

This repo uses a **hybrid deployment strategy**:

- `apps/user` and `apps/admin` deploy to **Vercel**.
- `apps/backend` deploys to an **always-on runtime** (not Vercel Functions) because it runs:
  - long-lived BullMQ workers
  - in-process schedulers (`setInterval`)

The source of truth is `deploy/strategy.yaml`.

### When changing deployment

1. Update `deploy/strategy.yaml` first.
2. Update docs in `docs/deployment/`.
3. Update CI/CD workflows in `.github/workflows/`.

### Guardrails

- Do not “just deploy backend to Vercel” without refactoring background workers and scheduling.
- Keep `dev` → `qa` → `prd` environment mapping consistent across Vercel projects, backend services, and env vars.

## Demo mode (zero-cost trials)

For zero-cost demos where the worker service is not kept running, the backend exposes **protected on-demand worker triggers** under `POST /ops/*`.

- Auth: `OPS_TRIGGER_TOKEN` (send as `Authorization: Bearer <token>` or `x-ops-token`)
- Endpoints: `/ops/scheduler/tick`, `/ops/tokens/sweep`, `/ops/campaigns/process`

Docs: `docs/deployment/demo-ops.md`
