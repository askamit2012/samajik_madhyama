# Environments (dev / qa / prd)

Branches map to environments:

- `dev` → Dev
- `qa` → QA/Staging
- `prd` → Production

The canonical mapping lives in `deploy/strategy.yaml`.

## Frontends (Vercel)

Each environment uses **separate Vercel Projects** for stable URLs:

- User app: `user-dev`, `user-qa`, `user-prd`
- Admin app: `admin-dev`, `admin-qa`, `admin-prd`

Env vars per Vercel Project:

- User app: set `NEXT_PUBLIC_API_URL` to the backend base URL for that environment.
- Admin app: set `VITE_API_URL` to the backend base URL for that environment.

## Backend (always-on)

Backend needs:

- Postgres: `DATABASE_URL`
- Redis: `REDIS_URL`
- Auth: `JWT_SECRET`
- AI: `GEMINI_API_KEY`
- CORS/URLs: `FRONTEND_URL`, `BACKEND_URL`
- Email: `SMTP_*` (consider switching to an HTTP email provider in production)

