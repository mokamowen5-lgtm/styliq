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

# Generate Prisma client + build API from inside the API workspace
WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm exec nest build

# Back to root
WORKDIR /app

# ── runner ────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

RUN apk add --no-cache dumb-init openssl tini

# Copy ENTIRE built apps/api workspace + monorepo node_modules (preserves pnpm symlinks)
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

WORKDIR /app/apps/api

EXPOSE 4000

ENTRYPOINT ["tini", "--"]
# On startup: run prisma db push if MIGRATE_ON_BOOT=true, then start the API
CMD ["sh", "-c", "if [ \"$MIGRATE_ON_BOOT\" = \"true\" ]; then pnpm exec prisma db push --accept-data-loss || true; fi && node dist/main"]
