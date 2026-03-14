# Backend hybrid hosting (always-on)

`apps/backend` currently assumes an always-on Node process:

- Starts an Express server (`app.listen`)
- Runs a post scheduler tick every 60s (in-process `setInterval`)
- Runs a BullMQ `Worker` that stays alive to process campaign jobs
- Sweeps expiring tokens on a 6-hour interval

## Recommended split

Keep the backend API as an always-on service, plus (optionally) separate workers:

- **API service**: handles HTTP requests
- **Worker service** (optional): runs BullMQ workers + schedulers

For small scale, API+worker can be one service; for reliability, split them.

## Cloud Run path (recommended)

Use Cloud Run for the backend:

- API service on Cloud Run in `APP_MODE=api` (scales to zero)
- Optional worker service on Cloud Run in `APP_MODE=worker` (runs BullMQ + schedulers)

Docs: `docs/deployment/cloud-run.md`

## If you want to move backend onto Vercel later

You must refactor to a serverless-friendly model:

1. Convert Express routes into serverless handlers (no `app.listen`)
2. Replace interval schedulers with external scheduling (event-driven or cron)
3. Replace BullMQ long-lived workers with request/trigger-driven job execution

Track that migration explicitly if attempted (add an ADR and update `deploy/strategy.yaml`).
