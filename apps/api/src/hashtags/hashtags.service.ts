import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../common/prisma.service"
import { RedisService } from "../common/redis.service"
import type { Prisma } from "@prisma/client"

@Injectable()
export class HashtagsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  /**
   * Extract hashtags from a free-text caption (e.g. "love this #streetwear #y2k look")
   */
  parseHashtags(text: string): string[] {
    const matches = text.matchAll(/#([a-zA-Z0-9_]{2,40})/g)
    const tags = new Set<string>()
    for (const m of matches) tags.add(m[1].toLowerCase())
    return Array.from(tags)
  }

  /**
   * Attach hashtags to an outfit (creates tags on the fly).
   */
  async attachToOutfit(outfitId: string, tags: string[]) {
    if (tags.length === 0) return

    await Promise.all(
      tags.map(async (tag) => {
        const hashtag = await this.prisma.hashtag.upsert({
          where: { tag },
          create: { tag, postsCount: 1 },
          update: { postsCount: { increment: 1 } },
        })

        await this.prisma.outfitHashtag.upsert({
          where: { outfitId_hashtagId: { outfitId, hashtagId: hashtag.id } },
          create: { outfitId, hashtagId: hashtag.id },
          update: {},
        })
      })
    )

    await this.redis.invalidatePattern(`hashtags:trending*`)
  }

  async findOne(tag: string) {
    const hashtag = await this.prisma.hashtag.findUnique({
      where: { tag: tag.toLowerCase() },
      include: { _count: { select: { outfits: true } } },
    })
    if (!hashtag) throw new NotFoundException("Hashtag not found")
    return hashtag
  }

  async getOutfitsForHashtag(tag: string, page = 1, limit = 24) {
    const hashtag = await this.findOne(tag)
    const skip = (page - 1) * limit

    const items = await this.prisma.outfitHashtag.findMany({
      where: { hashtagId: hashtag.id },
      orderBy: { outfit: { createdAt: "desc" } },
      skip,
      take: limit,
      include: {
        outfit: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
            },
          },
        },
      },
    })

    return {
      items: items.map((i) => i.outfit),
      total: hashtag.postsCount,
      page,
      totalPages: Math.ceil(hashtag.postsCount / limit),
      hashtag,
    }
  }

  async getTrending(limit = 20) {
    const cacheKey = `hashtags:trending:${limit}`
    const cached = await this.redis.getJson<unknown[]>(cacheKey)
    if (cached) return cached

    const items = await this.prisma.hashtag.findMany({
      where: { isTrending: true },
      orderBy: [{ trendScore: "desc" }, { postsCount: "desc" }],
      take: limit,
    })

    await this.redis.setJson(cacheKey, items, 300)
    return items
  }

  async search(query: string, limit = 10) {
    const trimmed = query.trim().toLowerCase().replace(/^#/, "")
    if (trimmed.length < 1) return []

    return this.prisma.hashtag.findMany({
      where: { tag: { startsWith: trimmed } },
      orderBy: [{ postsCount: "desc" }],
      take: limit,
    })
  }

  /**
   * Recompute trending hashtags. Should be triggered by a cron every 30 min.
   * Algorithm: trend = log(postsCount) * (1 + 7-day growth rate) * recency boost.
   */
  async recomputeTrending() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Count posts in the last 7 days per hashtag
    const recent = await this.prisma.outfitHashtag.groupBy({
      by: ["hashtagId"],
      where: { outfit: { createdAt: { gte: sevenDaysAgo } } },
      _count: { _all: true },
    })

    const recentMap = new Map(recent.map((r) => [r.hashtagId, r._count._all]))

    const all = await this.prisma.hashtag.findMany({ select: { id: true, postsCount: true } })

    await this.prisma.$transaction(
      all.map((h) => {
        const recentCount = recentMap.get(h.id) ?? 0
        const growth = recentCount / Math.max(h.postsCount, 1)
        const trendScore = Math.log10(h.postsCount + 1) * (1 + growth * 2)
        const isTrending = trendScore > 1.0 && recentCount > 5

        return this.prisma.hashtag.update({
          where: { id: h.id },
          data: { trendScore, growthRate7d: growth, isTrending },
        })
      })
    )

    await this.redis.invalidatePattern("hashtags:trending*")
    return { recomputed: all.length }
  }
}
