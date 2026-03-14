# MarketingOS: Local Setup Guide

Follow these steps to get the environment running on your local machine.

## Prerequisites
- **Node.js**: v20+ recommended
- **pnpm**: `npm install -g pnpm`
- **Docker**: Required for Postgres and Redis

## Sequential Setup Steps

### 1. Install Dependencies
Run from the root directory:
```bash
pnpm install
```

### 2. Configure Environment
Copy the example environment file to the backend:
```bash
cp .env.example apps/backend/.env
```
*Note: The automatic startup script will try to handle this, but manual sync ensures consistency.*

### 3. Initialize Databases
Ensure Docker is running, then pull and start the infrastructure:
```bash
docker compose up -d postgres redis
```

### 4. Run Migrations
Push the schema to your local database:
```bash
pnpm --filter database migrate:push
# or use drizzle-kit push depending on your workspace setup
```

### 5. Launch the Application
Start the dynamic orchestration script:
```bash
pnpm dev
```
The script will:
- Detect and avoid port collisions (starting from 4000 for backend, 3000 for UI).
- Launch all three services (Backend, Admin, User) sequentially.
- Automatically link the UI apps to the correct Backend port.

---

## Stopping & Teardown
To gracefully stop all services and free the specific ports used:
```bash
pnpm run kill
```
This reads the active port mapping and ensures no dangling processes remain.
