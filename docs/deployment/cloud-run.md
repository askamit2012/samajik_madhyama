# Cloud Run (backend hybrid)

This repo deploys frontends to Vercel and runs `apps/backend` on **Google Cloud Run**.

## Goals

- Lowest cost: Cloud Run **scales to zero** for the API service.
- Background processing is optional: enable a separate worker service only when needed.

## Prereqs (one-time)

1. Create a GCP project and pick a region (example: `asia-south1`).
2. Enable APIs in the project:
   - Cloud Run
   - Artifact Registry
   - IAM
   - Security Token Service (STS)
3. Create an Artifact Registry Docker repo (example repo name: `containers`).

## Auth from GitHub Actions (recommended: Workload Identity Federation)

Use OIDC/WIF so you don’t store a long-lived GCP key in GitHub.

You’ll create:

- A Workload Identity Pool + Provider for GitHub
- A Service Account with permissions to push images + deploy Cloud Run

### Required roles (typical)

Grant these roles to the GitHub Actions service account:

- `roles/run.admin`
- `roles/iam.serviceAccountUser`
- `roles/artifactregistry.writer`

## Cloud Run services

Recommended services per environment:

- API: `backend-dev`, `backend-qa`, `backend-prd`
- Worker (optional): `backend-worker-dev`, `backend-worker-qa`, `backend-worker-prd`

The backend supports modes via `APP_MODE`:

- `api`: mounts HTTP routes; does not start background workers/schedulers
- `worker`: starts BullMQ worker + schedulers; keeps only `/health`
- `all`: does both (local/dev convenience)

### Cost note (worker service)

If you deploy the optional worker service (`APP_MODE=worker`) and want it to continuously process BullMQ jobs and run schedulers, it must stay running. That usually means setting **min instances ≥ 1**, which is no longer “scale to zero”.
Start with API-only on Cloud Run (cheap), and enable the worker service only when you actually need background jobs in that environment.

## Secrets (recommended: Secret Manager)

Create **environment-specific secrets** (names used by workflow):

- `DATABASE_URL_DEV`, `DATABASE_URL_QA`, `DATABASE_URL_PRD`
- `REDIS_URL_DEV`, `REDIS_URL_QA`, `REDIS_URL_PRD`
- `JWT_SECRET_DEV`, `JWT_SECRET_QA`, `JWT_SECRET_PRD`
- `GEMINI_API_KEY_DEV`, `GEMINI_API_KEY_QA`, `GEMINI_API_KEY_PRD`

Optional:

- `SMTP_USER_*`, `SMTP_PASS_*`, `SMTP_HOST_*`, `SMTP_PORT_*`

Demo-only:

- `OPS_TRIGGER_TOKEN_*` (optional; enables protected on-demand ops triggers)

## GitHub Actions configuration

Workflow: `.github/workflows/deploy-cloudrun.yml`

Add these repository secrets:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_ARTIFACT_REPO`
- `GCP_WIF_PROVIDER` (Workload Identity Provider resource)
- `GCP_SERVICE_ACCOUNT` (service account email)

Optional repository variables:

- `DEPLOY_BACKEND_WORKER` set to `true` to also deploy worker services

## Frontend API base URLs

After Cloud Run deploy, set in Vercel (per environment project):

- `apps/user`: `NEXT_PUBLIC_API_URL=https://<cloud-run-url>`
- `apps/admin`: `VITE_API_URL=https://<cloud-run-url>`

## $0 demo mode (no always-on worker)

If you keep `DEPLOY_BACKEND_WORKER` disabled, you can still demo background features by enabling `OPS_TRIGGER_TOKEN` and calling the ops endpoints documented in `docs/deployment/demo-ops.md`.
