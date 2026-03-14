# syntax=docker/dockerfile:1

FROM node:20-slim

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# Copy only what we need for a workspace install first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN pnpm install --frozen-lockfile

# Now copy sources
COPY apps/backend apps/backend
COPY packages/database packages/database
COPY packages/typescript-config packages/typescript-config
COPY packages/eslint-config packages/eslint-config

WORKDIR /app/apps/backend

EXPOSE 4000

# Cloud Run sets PORT at runtime; Express already uses process.env.PORT.
CMD ["pnpm","start:ts"]

