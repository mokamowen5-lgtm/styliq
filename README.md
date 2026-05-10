# StyleSnap AI

> AI-powered fashion platform — generate photorealistic outfits, try on clothes virtually, and build your brand with one prompt.

---

## Stack

| Layer | Technology |
|---|---|
| **Web** | Next.js 15 (App Router, PPR), TypeScript, TailwindCSS, Framer Motion |
| **Mobile** | React Native + Expo 52, NativeWind, Reanimated 3 |
| **API** | NestJS 10, TypeScript, Prisma ORM, PostgreSQL 16 + pgvector |
| **Queue** | Bull + Redis |
| **AI** | OpenAI DALL·E 3, Replicate (SDXL, IDM-VTON), Stability AI |
| **Storage** | AWS S3 + CloudFront CDN |
| **Auth** | JWT (access + refresh), Google OAuth, Apple Sign-In |
| **Payments** | Stripe (subscriptions + marketplace) |
| **Analytics** | PostHog, Mixpanel, TikTok/Meta Pixel |
| **Infra** | Docker, GitHub Actions CI/CD, Vercel (web), Railway/Render (API) |

---

## Project Structure

```
stylesnap-ai/
├── apps/
│   ├── web/          Next.js 15 web application
│   ├── api/          NestJS REST API
│   └── mobile/       React Native Expo app
├── packages/
│   ├── types/        Shared TypeScript types
│   ├── ui/           Shared component library
│   ├── utils/        Shared utilities
│   └── config/       ESLint/TSConfig presets
├── infra/            Terraform, k8s manifests
├── .github/
│   └── workflows/    CI/CD pipelines
├── docker-compose.yml
└── turbo.json
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### 1. Clone & install

```bash
git clone https://github.com/your-org/stylesnap-ai.git
cd stylesnap-ai
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in your API keys (OpenAI, Replicate, Stripe, AWS, etc.)
```

### 3. Start infrastructure

```bash
docker-compose up postgres redis -d
```

### 4. Initialize database

```bash
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to DB
pnpm db:seed       # Seed with demo data
```

### 5. Start all apps

```bash
pnpm dev
```

| App | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| API Docs | http://localhost:4000/api/docs |
| Prisma Studio | http://localhost:5555 |

---

## Features

### Free Tier
- 5 AI outfit generations / day
- Standard quality
- Social feed access
- Basic saving & sharing

### Premium (€9/month)
- Unlimited HD generations
- Advanced virtual try-on
- No watermarks
- Priority queue

### VIP (€29/month)
- Everything in Premium
- Ultra-fast generation
- Brand design studio (hoodies, logos, sneakers)
- Trend analytics dashboard
- Dropshipping integration

---

## AI Generation Pipeline

```
User Input (photo + style)
        │
        ▼
  Quota check (Redis)
        │
        ▼
  Bull queue (priority by tier)
        │
        ▼
  SDXL + ControlNet (Replicate)   ← if photo provided
     OR DALL·E 3 (OpenAI)         ← text-to-image
        │
        ▼
  Sharp optimization (WebP, resize)
        │
        ▼
  S3 upload → CloudFront CDN
        │
        ▼
  Virality score prediction
        │
        ▼
  WebSocket notification to client
```

---

## API Reference

Full interactive docs at `/api/docs` (Swagger UI).

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/google
```

### AI Generation

```http
POST /api/v1/ai/generate/outfit      # Generate outfit
POST /api/v1/ai/generate/tryon       # Virtual try-on (Premium+)
POST /api/v1/ai/generate/brand       # Brand design (VIP)
GET  /api/v1/ai/generations          # Generation history
GET  /api/v1/ai/recommendations      # Personalized recommendations
GET  /api/v1/ai/trends               # Trending styles
```

### Social

```http
GET  /api/v1/outfits                 # Feed (cursor paginated)
POST /api/v1/outfits                 # Create outfit post
POST /api/v1/outfits/:id/like        # Like/unlike
POST /api/v1/outfits/:id/save        # Save/unsave
GET  /api/v1/outfits/:id/comments    # Comments
```

---

## Database

PostgreSQL 16 with pgvector extension for AI embeddings.

Run Prisma Studio to explore data:

```bash
pnpm db:studio
```

Key models: `User`, `Subscription`, `AiGeneration`, `Outfit`, `Product`, `Order`, `Follow`, `StyleTrend`

---

## Deployment

### Web → Vercel

```bash
vercel deploy --prod
```

### API → Railway / Render

```bash
# Using Docker image from GitHub Container Registry
docker pull ghcr.io/your-org/stylesnap-ai/api:latest
docker run -p 4000:4000 --env-file .env ghcr.io/your-org/stylesnap-ai/api:latest
```

### Mobile → EAS Build

```bash
cd apps/mobile
eas build --platform all --profile production
eas submit --platform all
```

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © StyleSnap AI 2026
