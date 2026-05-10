# ════════════════════════════════════════════════════════════
# STYLIQ API — multi-stage Docker build optimized for Railway/Render
# ════════════════════════════════════════════════════════════

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# ── deps ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

# Copy lockfiles & manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/

# Install all deps (including dev — needed for build)
RUN pnpm install --frozen-lockfile=false

# ── builder ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client first
RUN pnpm --filter @stylesnap/api exec prisma generate

# Build the API (NestJS → dist/)
RUN pnpm --filter @stylesnap/api build

# Prune to production-only deps for smaller runner image
RUN pnpm --filter @stylesnap/api prune --prod || true

# ── runner ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache dumb-init openssl tini

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Run prisma migrate deploy on startup if MIGRATE_ON_BOOT=true
COPY --from=builder /app/apps/api/scripts ./scripts

EXPOSE 4000

# Use non-root user for security
USER node

ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "if [ \"$MIGRATE_ON_BOOT\" = \"true\" ]; then npx prisma migrate deploy; fi && node dist/main"]
