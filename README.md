# 🌐 Samajika Madhyama

> **Samajika Madhyama** (सामाजिक माध्यम) — A full-stack social media & email marketing management platform, inspired by Buffer. Manage social posts, schedule campaigns, and track analytics — all from one beautiful dashboard.

---

## ✨ Features

- 📅 **Social Media Scheduling** — Compose, queue, and publish posts across platforms
- 📊 **Analytics Dashboard** — Track reach, engagement, and growth metrics
- 🔗 **OAuth Integration** — Connect social accounts via secure OAuth flows
- 📧 **Email Campaigns** — Create templates, manage contact lists, and send campaigns
- 🔐 **Authentication** — JWT-based auth with role-aware admin panel
- 🗄️ **Type-safe Database** — Drizzle ORM with PostgreSQL and full migrations

---

## 🏗️ Architecture

This is a **pnpm + Turborepo monorepo** with the following structure:

```
samajika_madhyama/
├── apps/
│   ├── admin/        # React + Vite — Admin dashboard
│   ├── user/         # Next.js 14 — User-facing social & email app
│   └── backend/      # Express.js — REST API server (port 4000)
├── packages/
│   ├── database/     # Drizzle ORM schema, migrations, DB client
│   ├── ui/           # Shared React component library (shadcn/ui base)
│   ├── tailwind-config/     # Shared Tailwind CSS configuration
│   ├── typescript-config/   # Shared tsconfig presets
│   └── eslint-config/       # Shared ESLint rules
├── docker-compose.yml        # PostgreSQL 15 via Docker
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| pnpm | 9.x |
| Docker & Docker Compose | Latest |

### 1. Clone the repository

```bash
git clone https://github.com/askamit2012/samajik_madhyama.git
cd samajik_madhyama
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the database

```bash
docker compose up -d
```

This starts a **PostgreSQL 15** instance on port `5432`.

### 4. Set up environment variables

Create `.env` files in the relevant apps. For the backend:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Typical backend `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social
JWT_SECRET=your_jwt_secret_here
PORT=4000
```

### 5. Run database migrations

```bash
pnpm --filter database run migrate
```

### 6. Start all apps

```bash
pnpm run dev
```

This uses Turborepo to start all apps in parallel:

| App | URL |
|-----|-----|
| User App (Next.js) | http://localhost:3000 |
| Admin App (Vite) | http://localhost:5173 |
| Backend API | http://localhost:4000 |

---

## 📡 API Overview

The Express backend exposes the following routes:

| Route | Description |
|-------|-------------|
| `GET /health` | Health check |
| `POST /auth/...` | Login, register, token refresh |
| `GET/POST /posts` | Social media posts (CRUD) |
| `GET/POST /contacts` | Email contact management |
| `GET/POST /templates` | Email templates |
| `GET/POST /campaigns` | Email campaigns |
| `GET/POST /platform-credentials` | Social platform OAuth credentials |
| `GET/POST /oauth/...` | OAuth callback flows |
| `GET/POST /admin-users` | Admin user management |

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (User) | Next.js 14, React 18, Tailwind CSS |
| Frontend (Admin) | React + Vite, Tailwind CSS |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL 15 (via Docker) |
| ORM | Drizzle ORM |
| Auth | JWT |
| Monorepo | pnpm Workspaces + Turborepo |
| UI Components | shadcn/ui |

---

## 🛠️ Development Scripts

```bash
# Start all apps in dev mode
pnpm run dev

# Build all apps
pnpm run build

# Type-check all packages
pnpm run typecheck

# Lint all packages
pnpm run lint

# Kill dev server ports (3000, 4000, 5173)
pnpm run kill
```

---

## 🗄️ Database

Migrations live in `packages/database/drizzle/`. The schema is defined in `packages/database/src/schema.ts` using Drizzle ORM.

```bash
# Generate a new migration
pnpm --filter database run generate

# Apply migrations
pnpm --filter database run migrate
```

---

## 📁 Shared Packages

| Package | Purpose |
|---------|---------|
| `@repo/database` | Drizzle schema + DB client shared across all apps |
| `@repo/ui` | Shared React components (Button, Card, Input, etc.) |
| `@repo/tailwind-config` | Shared Tailwind config |
| `@repo/typescript-config` | Shared TypeScript compiler options |
| `@repo/eslint-config` | Shared ESLint configuration |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and not yet licensed for public use.

---

<p align="center">Built with ❤️ by <a href="https://github.com/askamit2012">askamit2012</a></p>
