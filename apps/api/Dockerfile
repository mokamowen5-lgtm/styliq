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
RUN pnpm install --frozen-lockfile=false --ignore-scripts

# ── builder ───────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (use direct path to bypass pnpm filter resolution)
WORKDIR /app/apps/api
RUN npx --no-install prisma generate || ../../node_modules/.bin/prisma generate

# Build the API (NestJS → dist/)
RUN ../../node_modules/.bin/nest build

# Back to root
WORKDIR /app

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

EXPOSE 4000

USER node

ENTRYPOINT ["tini", "--"]
# On startup: run prisma migrate deploy if MIGRATE_ON_BOOT=true, then start the API
CMD ["sh", "-c", "if [ \"$MIGRATE_ON_BOOT\" = \"true\" ]; then ./node_modules/.bin/prisma migrate deploy 2>/dev/null || ./node_modules/.bin/prisma db push --accept-data-loss 2>/dev/null || true; fi && node dist/main"]
