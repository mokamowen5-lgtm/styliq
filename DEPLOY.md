# 🚀 STYLIQ — Deployment Guide

Stack: **Vercel** (web) + **Railway** (API + Postgres + Redis) + **EAS** (mobile).

---

## ⚡ TL;DR

1. Push your repo to **GitHub**
2. Deploy **API** on Railway (one-click from Dockerfile)
3. Provision **Postgres + Redis** on Railway
4. Deploy **Web** on Vercel (one-click from Next.js)
5. Wire env vars between the two
6. (Optional) Deploy mobile via EAS Build

Total time: **~25 minutes**.

---

## Step 1 — Push to GitHub

```bash
cd C:\Users\AAA\stylesnap-ai

# Initialize repo if you haven't already
git init
git branch -M main

# Add a remote (create the repo on github.com first)
git remote add origin https://github.com/YOUR_USERNAME/styliq.git

# Stage everything except .env files
git add -A
git status   # double-check NO .env is staged

# Commit
git commit -m "feat: initial Styliq commit"

# Push
git push -u origin main
```

> ⚠️ Make sure `.env`, `.env.local`, `apps/api/.env` are in `.gitignore` (they are by default).

---

## Step 2 — Deploy API on Railway

### 2.1 Create the project

1. Go to **https://railway.app**, sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo** → select your `styliq` repo
3. Railway auto-detects the `apps/api/Dockerfile`. Click **Deploy**.

### 2.2 Add Postgres + Redis

In your Railway project dashboard:

1. Click **+ New** → **Database** → **Add PostgreSQL** (with pgvector!)

   > Railway's default Postgres image **doesn't include pgvector**. Two options:
   >
   > **Option A — Bring your own:** use the `pgvector/pgvector:pg16` Docker image. In Railway: **+ New** → **Empty Service** → set image to `pgvector/pgvector:pg16`. Add the env vars `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
   >
   > **Option B — Use Supabase or Neon:** both support pgvector out of the box. Get the connection string and skip Railway's DB.

2. Click **+ New** → **Database** → **Add Redis**

### 2.3 Configure API env vars

In the API service → **Variables** tab, add:

```
NODE_ENV=production
PORT=4000

# Use Railway's reference syntax for internal connections:
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Auth
JWT_SECRET=<generate a 64-char random string — `openssl rand -base64 48`>
JWT_REFRESH_SECRET=<another 64-char random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI
OPENAI_API_KEY=sk-proj-...
REPLICATE_API_TOKEN=r8_...

# Frontend (set after Vercel deploy)
APP_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app

# Run migrations on each deploy
MIGRATE_ON_BOOT=true

# Optional — Stripe (for paid features)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_VIP_PRICE_ID=price_...

# Optional — AWS S3 (otherwise uses local filesystem)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
AWS_S3_BUCKET=styliq-prod
AWS_CLOUDFRONT_URL=https://cdn.styliq.ai
```

### 2.4 Generate a domain

API service → **Settings** → **Networking** → **Generate Domain**.
You'll get something like `https://styliq-api-production.up.railway.app`.

### 2.5 Push schema + seed (one-time)

Locally, set `DATABASE_URL` to the Railway Postgres URL and run:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @stylesnap/api exec prisma db push
DATABASE_URL="postgresql://..." pnpm --filter @stylesnap/api run db:seed
```

(Or set `MIGRATE_ON_BOOT=true` in env vars and Railway will run migrations on every deploy.)

---

## Step 3 — Deploy Web on Vercel

### 3.1 Import the project

1. Go to **https://vercel.com**, sign in with GitHub
2. Click **Add New** → **Project** → import your `styliq` repo
3. Vercel detects Next.js. Set:
   - **Root Directory**: `apps/web`
   - **Build Command**: leave default (Vercel reads `vercel.json`)
   - **Install Command**: leave default
4. Click **Deploy**

### 3.2 Add env vars (Settings → Environment Variables)

```
NEXT_PUBLIC_API_URL=https://styliq-api-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional Stripe (for client-side checkout button)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Then **redeploy** so the vars are picked up.

### 3.3 Wire it back to Railway

Go back to Railway → API → Variables and update:
```
APP_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

This way the API's CORS lets Vercel through.

### 3.4 Custom domain

- Vercel: **Settings → Domains** → add `styliq.ai` (point your DNS to Vercel)
- Railway: **Settings → Networking → Custom Domain** → add `api.styliq.ai`
- Update env vars accordingly

---

## Step 4 — Mobile (Optional, EAS Build)

### 4.1 Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 4.2 Configure

```bash
cd apps/mobile
eas build:configure
```

This creates `eas.json`. Edit your `app.json` to set the production API URL:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://styliq-api-production.up.railway.app"
    }
  }
}
```

### 4.3 Build

```bash
# iOS (requires Apple Developer Program $99/year)
eas build --platform ios --profile production

# Android (free)
eas build --platform android --profile production
```

### 4.4 Submit

```bash
eas submit --platform ios
eas submit --platform android
```

---

## Cost summary (monthly)

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby | **Free** |
| Railway | Starter (API + Postgres + Redis) | ~**$5–15** |
| OpenAI | Pay-as-you-go | ~$0.04/image |
| Replicate | Pay-as-you-go | ~$0.003/image |
| Apple Dev | Mandatory for iOS submit | $99/year |
| Google Play | One-time | $25 |

**MVP-ready:** ~$5/month.

---

## Troubleshooting

### CORS errors in browser
→ Check that `APP_URL` and `FRONTEND_URL` env vars on Railway match your Vercel domain exactly.

### `404` on API calls
→ Check `NEXT_PUBLIC_API_URL` on Vercel includes `https://` and no trailing slash.

### Prisma `pgvector` extension not found
→ Use the `pgvector/pgvector:pg16` image (Option A above) or use Supabase/Neon for managed Postgres with pgvector built-in.

### Railway build fails on Docker
→ Check `pnpm-lock.yaml` is committed. Railway needs it to build deterministically.

### Web build fails on Vercel ("Cannot find module @stylesnap/types")
→ Check `apps/web/vercel.json` exists with the multi-workspace `buildCommand` — Vercel needs to install at the root.

---

## Production checklist

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong (≥ 64 chars, random)
- [ ] `MIGRATE_ON_BOOT=true` set on Railway
- [ ] All `OPENAI_API_KEY` / `REPLICATE_API_TOKEN` rotated (not the dev ones leaked in chat)
- [ ] Stripe webhook URL configured at https://dashboard.stripe.com → `https://api.styliq.ai/api/v1/subscriptions/webhook`
- [ ] Custom domain pointing to Vercel + Railway
- [ ] Lighthouse audit on the prod URL (target ≥ 90)
- [ ] Healthcheck OK at `https://api.styliq.ai/api/v1/health`
