# ════════════════════════════════════════════════════════════
# STYLIQ API — multi-stage Docker build optimized for Railway/Render
# ════════════════════════════════════════════════════════════

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# ── builder ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy the entire monorepo (we need all source + lockfile for workspace symlinks)
COPY . .

# Install everything — this creates proper pnpm workspace symlinks in apps/api/node_modules
RUN pnpm install --frozen-lockfile=false --ignore-scripts

# Generate Prisma client + build API (run from inside the API workspace)
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm exec nest build

# ── runner ────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache dumb-init openssl tini

# Copy ENTIRE build output (preserves all pnpm symlinks for workspace deps)
COPY --from=builder /app /app

WORKDIR /app/apps/api

EXPOSE 4000

ENTRYPOINT ["tini", "--"]
# On startup: push DB schema if MIGRATE_ON_BOOT=true, then start the API
CMD ["sh", "-c", "if [ \"$MIGRATE_ON_BOOT\" = \"true\" ]; then pnpm exec prisma db push --accept-data-loss || true; fi && node dist/main"]
