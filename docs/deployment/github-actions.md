# GitHub Actions setup

Workflow: `.github/workflows/deploy-vercel.yml`
Cloud Run workflow: `.github/workflows/deploy-cloudrun.yml`

## Required GitHub Secrets

Create these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_USER_DEV`
- `VERCEL_PROJECT_ID_USER_QA`
- `VERCEL_PROJECT_ID_USER_PRD`
- `VERCEL_PROJECT_ID_ADMIN_DEV`
- `VERCEL_PROJECT_ID_ADMIN_QA`
- `VERCEL_PROJECT_ID_ADMIN_PRD`

## Vercel Project setup (6 projects)

Create one Vercel Project per app per environment:

- User app (`apps/user` root directory): `user-dev`, `user-qa`, `user-prd`
- Admin app (`apps/admin` root directory): `admin-dev`, `admin-qa`, `admin-prd`

## Environment variables per Vercel Project

- User app: set `NEXT_PUBLIC_API_URL` to that environment’s backend base URL.
- Admin app: set `VITE_API_URL` to that environment’s backend base URL.

## Branch flow

Your PR/merge flow (`dev` → `qa` → `prd`) should result in pushes to those branches, which triggers deployments automatically.
