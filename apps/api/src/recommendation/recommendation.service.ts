import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { OnEvent } from "@nestjs/event-emitter"
import OpenAI from "openai"
import { PrismaService } from "../common/prisma.service"
import { RedisService } from "../common/redis.service"
import { Prisma } from "@prisma/client"
import type { FeedType, WatchEventType } from "@prisma/client"

/**
 * Recommendation engine — TikTok/Pinterest style.
 *
 * Strategy:
 *  1. WatchEvent collection (every interaction enriches the user signal)
 *  2. UserEmbedding computed from saved/liked outfits (averaged vector)
 *  3. Outfit embedding (via OpenAI text-embedding-3-small over title+styles+tags)
 *  4. Cosine similarity via pgvector for ranking
 *  5. Multi-armed bandit blend: 70% personalized, 20% trending, 10% serendipity
 *  6. Diversity penalty so we don't show 10 outfits from the same creator
 */
@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name)
  private _openai: OpenAI | null = null

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService
  ) {}

  private get openai(): OpenAI | null {
    if (this._openai) return this._openai
    const key = this.config.get<string>("ai.openaiApiKey")
    if (!key) return null
    this._openai = new OpenAI({ apiKey: key })
    return this._openai
  }

  // ─── Event collection ──────────────────────────────────────

  async trackEvent(
    userId: string,
    outfitId: string,
    eventType: WatchEventType,
    options?: { durationMs?: number; feedType?: FeedType; position?: number; sessionId?: string }
  ) {
    await this.prisma.watchEvent.create({
      data: {
        userId,
        outfitId,
        eventType,
        durationMs: options?.durationMs,
        feedType: options?.feedType,
        position: options?.position,
        sessionId: options?.sessionId,
      },
    })

    // Bump aesthetic profile counters
    if (eventType === "SAVE" || eventType === "LIKE") {
      await this.prisma.aestheticProfile.upsert({
        where: { userId },
        create: {
          userId,
          totalSaves: eventType === "SAVE" ? 1 : 0,
          totalLikes: eventType === "LIKE" ? 1 : 0,
        },
        update: {
          totalSaves: eventType === "SAVE" ? { increment: 1 } : undefined,
          totalLikes: eventType === "LIKE" ? { increment: 1 } : undefined,
        },
      })

      // Schedule embedding recomputation if enough new signal
      await this.maybeQueueEmbeddingRecompute(userId)
    }
  }

  // ─── Embedding generation ──────────────────────────────────

  async embedOutfit(outfitId: string) {
    if (!this.openai) {
      this.logger.warn("OpenAI not configured — skipping embedding")
      return
    }

    const outfit = await this.prisma.outfit.findUnique({
      where: { id: outfitId },
      select: { title: true, description: true, styles: true, tags: true },
    })
    if (!outfit) return

    const text = [
      outfit.title,
      outfit.description ?? "",
      outfit.styles.join(" "),
      outfit.tags.join(" "),
    ].join(" · ").slice(0, 8000)

    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536,
    })

    const vector = response.data[0]?.embedding
    if (!vector) return

    // Use raw SQL because Prisma doesn't support pgvector inputs natively
    await this.prisma.$executeRaw`
      UPDATE outfits
      SET embedding = ${`[${vector.join(",")}]`}::vector
      WHERE id = ${outfitId}::uuid
    `
  }

  /**
   * Compute the user's aesthetic embedding by averaging the embeddings of
   * their last 50 saved/liked outfits.
   */
  async computeUserEmbedding(userId: string) {
    const recent = await this.prisma.$queryRaw<Array<{ embedding: number[] }>>`
      SELECT o.embedding::text::float[] AS embedding
      FROM outfits o
      WHERE o.id IN (
        SELECT outfit_id FROM saved_outfits WHERE user_id = ${userId}::uuid
        UNION
        SELECT outfit_id FROM likes WHERE user_id = ${userId}::uuid
      )
      AND o.embedding IS NOT NULL
      ORDER BY o."createdAt" DESC
      LIMIT 50
    `

    if (recent.length === 0) return

    const dim = recent[0].embedding.length
    const avg = new Array(dim).fill(0)
    for (const row of recent) {
      for (let i = 0; i < dim; i++) avg[i] += row.embedding[i]
    }
    for (let i = 0; i < dim; i++) avg[i] /= recent.length

    await this.prisma.$executeRaw`
      INSERT INTO user_embeddings (user_id, vector, last_computed_at, interaction_count)
      VALUES (${userId}::uuid, ${`[${avg.join(",")}]`}::vector, NOW(), ${recent.length})
      ON CONFLICT (user_id) DO UPDATE
      SET vector = EXCLUDED.vector,
          last_computed_at = NOW(),
          interaction_count = EXCLUDED.interaction_count
    `

    await this.redis.invalidatePattern(`reco:${userId}*`)
  }

  // ─── Ranking ───────────────────────────────────────────────

  /**
   * Get a personalized ranked feed for a user.
   * Returns outfit IDs in optimal order.
   */
  async getRankedFeed(
    userId: string,
    feedType: FeedType,
    limit = 30
  ): Promise<{ outfitIds: string[]; scores: number[]; cached: boolean }> {
    const cacheKey = `reco:${userId}:${feedType}`
    const cached = await this.prisma.recommendationCache.findUnique({
      where: { userId_feedType: { userId, feedType } },
    })

    if (cached && cached.expiresAt > new Date()) {
      return {
        outfitIds: cached.outfitIds.slice(0, limit),
        scores: cached.scores.slice(0, limit),
        cached: true,
      }
    }

    const ranked = await this.computeRanking(userId, feedType, limit * 2)

    // Apply diversity penalty (no more than 2 from same creator in top 10)
    const diversified = this.applyDiversityFilter(ranked).slice(0, limit)

    await this.prisma.recommendationCache.upsert({
      where: { userId_feedType: { userId, feedType } },
      create: {
        userId,
        feedType,
        outfitIds: diversified.map((r) => r.outfitId),
        scores: diversified.map((r) => r.score),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5min cache
      },
      update: {
        outfitIds: diversified.map((r) => r.outfitId),
        scores: diversified.map((r) => r.score),
        computedAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    return {
      outfitIds: diversified.map((r) => r.outfitId),
      scores: diversified.map((r) => r.score),
      cached: false,
    }
  }

  /**
   * Heavy lifting: compute the ranking with embeddings + virality + recency.
   */
  private async computeRanking(
    userId: string,
    feedType: FeedType,
    poolSize: number
  ): Promise<Array<{ outfitId: string; score: number; userId: string }>> {
    const userEmb = await this.prisma.userEmbedding.findUnique({ where: { userId } })

    // Cold start: no embedding yet → rely on trending + user's stated favorite styles
    if (!userEmb) {
      return this.coldStartRanking(userId, feedType, poolSize)
    }

    // Filter outfits the user has already seen (skip / view) in last 24h
    const seenIds = await this.getSeenOutfitIds(userId, 24)

    // pgvector cosine similarity query
    const candidates = await this.prisma.$queryRaw<
      Array<{ id: string; user_id: string; similarity: number; virality_score: number; created_at: Date }>
    >`
      SELECT
        o.id,
        o.user_id,
        1 - (o.embedding <=> u.vector) AS similarity,
        o."viralityScore" AS virality_score,
        o."createdAt" AS created_at
      FROM outfits o, user_embeddings u
      WHERE u.user_id = ${userId}::uuid
        AND o.embedding IS NOT NULL
        AND o."isPublic" = true
        AND o.user_id != ${userId}::uuid
        ${seenIds.length > 0 ? Prisma.sql`AND o.id NOT IN (${Prisma.join(seenIds.map((id) => Prisma.sql`${id}::uuid`))})` : Prisma.empty}
      ORDER BY o.embedding <=> u.vector
      LIMIT ${poolSize}
    `

    // Final score: 0.6 similarity + 0.25 virality + 0.15 recency
    const now = Date.now()
    const ranked = candidates.map((c) => {
      const ageHours = (now - new Date(c.created_at).getTime()) / 3_600_000
      const recencyScore = Math.exp(-ageHours / 168) // 7-day half-life
      const score = 0.6 * c.similarity + 0.25 * c.virality_score + 0.15 * recencyScore
      return { outfitId: c.id, score, userId: c.user_id }
    })

    // Inject 20% trending + 10% serendipity for non-following feeds
    if (feedType === "FOR_YOU" || feedType === "DISCOVER") {
      const trendingPool = await this.prisma.outfit.findMany({
        where: {
          isPublic: true,
          isTrending: true,
          id: { notIn: [...seenIds, ...ranked.map((r) => r.outfitId)] },
        },
        select: { id: true, userId: true, viralityScore: true },
        orderBy: { viralityScore: "desc" },
        take: Math.floor(poolSize * 0.3),
      })
      for (const t of trendingPool) {
        ranked.push({ outfitId: t.id, score: 0.5 + t.viralityScore * 0.5, userId: t.userId })
      }
    }

    return ranked.sort((a, b) => b.score - a.score)
  }

  private async coldStartRanking(
    userId: string,
    feedType: FeedType,
    poolSize: number
  ): Promise<Array<{ outfitId: string; score: number; userId: string }>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { favoriteStyles: true },
    })

    const where: Prisma.OutfitWhereInput = {
      isPublic: true,
      userId: { not: userId },
    }

    if (feedType === "TRENDING" || !user?.favoriteStyles?.length) {
      where.isTrending = true
    } else {
      where.styles = { hasSome: user.favoriteStyles as any }
    }

    const outfits = await this.prisma.outfit.findMany({
      where,
      orderBy: [{ viralityScore: "desc" }, { createdAt: "desc" }],
      take: poolSize,
      select: { id: true, userId: true, viralityScore: true },
    })

    return outfits.map((o) => ({
      outfitId: o.id,
      score: o.viralityScore,
      userId: o.userId,
    }))
  }

  /**
   * Apply diversity penalty: no more than N items from the same creator in top K.
   */
  private applyDiversityFilter(
    ranked: Array<{ outfitId: string; score: number; userId: string }>,
    maxPerCreator = 2
  ): Array<{ outfitId: string; score: number; userId: string }> {
    const counts = new Map<string, number>()
    const result: typeof ranked = []
    const overflow: typeof ranked = []

    for (const item of ranked) {
      const c = counts.get(item.userId) ?? 0
      if (c < maxPerCreator) {
        result.push(item)
        counts.set(item.userId, c + 1)
      } else {
        overflow.push(item)
      }
    }
    return [...result, ...overflow]
  }

  private async getSeenOutfitIds(userId: string, hoursBack: number): Promise<string[]> {
    const since = new Date(Date.now() - hoursBack * 3_600_000)
    const events = await this.prisma.watchEvent.findMany({
      where: {
        userId,
        eventType: { in: ["VIEW", "SKIP"] },
        createdAt: { gte: since },
      },
      select: { outfitId: true },
      distinct: ["outfitId"],
    })
    return events.map((e) => e.outfitId)
  }

  private async maybeQueueEmbeddingRecompute(userId: string) {
    const profile = await this.prisma.userEmbedding.findUnique({ where: { userId } })
    const newInteractions = await this.prisma.watchEvent.count({
      where: {
        userId,
        eventType: { in: ["SAVE", "LIKE"] },
        createdAt: { gte: profile?.lastComputedAt ?? new Date(0) },
      },
    })
    if (newInteractions >= 10) {
      // In production this would be a background job
      await this.computeUserEmbedding(userId).catch((err) =>
        this.logger.error(`Failed to recompute embedding for ${userId}`, err)
      )
    }
  }

  // ─── Auto-embed new outfits ────────────────────────────────

  @OnEvent("outfit.created")
  async onOutfitCreated(payload: { outfitId: string }) {
    await this.embedOutfit(payload.outfitId).catch((err) =>
      this.logger.error(`Failed to embed outfit ${payload.outfitId}`, err)
    )
  }
}

// (Prisma is imported at the top of the file)
