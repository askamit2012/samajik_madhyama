# Vercel (user/admin)

## Projects

Create one Vercel Project per app per environment (6 total):

- `user-dev`, `user-qa`, `user-prd` (Root Directory: `apps/user`)
- `admin-dev`, `admin-qa`, `admin-prd` (Root Directory: `apps/admin`)

## GitHub Actions deployments

Deployments are triggered by branch pushes:

- push to `dev` → deploy `*-dev` projects
- push to `qa` → deploy `*-qa` projects
- push to `prd` → deploy `*-prd` projects

Workflow: `.github/workflows/deploy-vercel.yml`

### Required GitHub Secrets

Organization-wide:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`

Project IDs (6 secrets):

- `VERCEL_PROJECT_ID_USER_DEV`
- `VERCEL_PROJECT_ID_USER_QA`
- `VERCEL_PROJECT_ID_USER_PRD`
- `VERCEL_PROJECT_ID_ADMIN_DEV`
- `VERCEL_PROJECT_ID_ADMIN_QA`
- `VERCEL_PROJECT_ID_ADMIN_PRD`

