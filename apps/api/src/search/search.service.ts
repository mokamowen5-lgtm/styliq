import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import OpenAI from "openai"
import { PrismaService } from "../common/prisma.service"
import { RedisService } from "../common/redis.service"
import { HashtagsService } from "../hashtags/hashtags.service"
import type { Prisma } from "@prisma/client"

interface SearchResult {
  outfits: any[]
  users: any[]
  hashtags: any[]
  boards: any[]
  total: number
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)
  private _openai: OpenAI | null = null

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private hashtags: HashtagsService,
    private config: ConfigService
  ) {}

  private get openai(): OpenAI | null {
    if (this._openai) return this._openai
    const key = this.config.get<string>("ai.openaiApiKey")
    if (!key) return null
    this._openai = new OpenAI({ apiKey: key })
    return this._openai
  }

  /**
   * Universal search: returns outfits + users + hashtags + boards.
   */
  async universalSearch(
    query: string,
    viewerId?: string,
    limit = 8
  ): Promise<SearchResult> {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { outfits: [], users: [], hashtags: [], boards: [], total: 0 }
    }

    if (viewerId) {
      this.recordHistory(viewerId, trimmed, "text").catch(() => {})
    }

    const [outfits, users, hashtags, boards] = await Promise.all([
      this.searchOutfits(trimmed, limit),
      this.searchUsers(trimmed, limit),
      this.hashtags.search(trimmed, limit),
      this.searchBoards(trimmed, limit),
    ])

    return {
      outfits,
      users,
      hashtags,
      boards,
      total: outfits.length + users.length + hashtags.length + boards.length,
    }
  }

  async searchOutfits(query: string, limit = 24) {
    return this.prisma.outfit.findMany({
      where: {
        isPublic: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      orderBy: [{ viralityScore: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
    })
  }

  async searchUsers(query: string, limit = 12) {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        isBanned: false,
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ followersCount: "desc" }],
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        followersCount: true,
        outfitsCount: true,
      },
    })
  }

  async searchBoards(query: string, limit = 12) {
    return this.prisma.board.findMany({
      where: {
        visibility: "PUBLIC",
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      orderBy: [{ followersCount: "desc" }],
      take: limit,
      include: {
        owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        items: {
          take: 4,
          include: { outfit: { select: { id: true, thumbnailUrl: true, imageUrl: true } } },
        },
      },
    })
  }

  /**
   * Visual search: given an image URL, find similar outfits using vector search.
   */
  async visualSearch(imageUrl: string, limit = 24): Promise<any[]> {
    if (!this.openai) {
      this.logger.warn("OpenAI not configured — falling back to trending outfits for visual search")
      return this.prisma.outfit.findMany({
        where: { isPublic: true, isTrending: true },
        orderBy: { viralityScore: "desc" },
        take: limit,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      })
    }

    // 1. Get a textual description of the image via GPT-4 vision
    const description = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this outfit's style, colors, garments, vibe in 30 words. Focus on fashion aesthetics. Output only the description.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    })

    const desc = description.choices[0]?.message.content ?? ""

    // 2. Embed that description
    const embedding = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: desc,
      dimensions: 1536,
    })

    const vector = embedding.data[0]?.embedding
    if (!vector) return []

    // 3. Search by cosine similarity
    const similar = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM outfits
      WHERE embedding IS NOT NULL AND "isPublic" = true
      ORDER BY embedding <=> ${`[${vector.join(",")}]`}::vector
      LIMIT ${limit}
    `

    if (similar.length === 0) return []

    return this.prisma.outfit.findMany({
      where: { id: { in: similar.map((s) => s.id) } },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      },
    })
  }

  /**
   * Autocomplete: returns suggestions as the user types.
   */
  async autocomplete(query: string, limit = 8) {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 1) {
      return this.getDefaultSuggestions()
    }

    const cacheKey = `search:autocomplete:${trimmed}:${limit}`
    const cached = await this.redis.getJson<unknown>(cacheKey)
    if (cached) return cached

    const [hashtags, users, recentSearches] = await Promise.all([
      this.prisma.hashtag.findMany({
        where: { tag: { startsWith: trimmed } },
        orderBy: { postsCount: "desc" },
        take: limit,
        select: { tag: true, postsCount: true, isTrending: true },
      }),
      this.prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { username: { startsWith: trimmed } },
            { displayName: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        orderBy: { followersCount: "desc" },
        take: limit / 2,
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
      }),
      this.prisma.searchHistory.findMany({
        where: { query: { startsWith: trimmed } },
        orderBy: { createdAt: "desc" },
        distinct: ["query"],
        take: 3,
        select: { query: true },
      }),
    ])

    const result = {
      hashtags: hashtags.map((h) => ({
        type: "hashtag" as const,
        text: `#${h.tag}`,
        meta: `${h.postsCount} posts${h.isTrending ? " · 🔥" : ""}`,
      })),
      users: users.map((u) => ({
        type: "user" as const,
        text: u.displayName,
        sub: `@${u.username}`,
        avatarUrl: u.avatarUrl,
        verified: u.isVerified,
        id: u.id,
      })),
      recent: recentSearches.map((r) => ({
        type: "recent" as const,
        text: r.query,
      })),
    }

    await this.redis.setJson(cacheKey, result, 60)
    return result
  }

  private async getDefaultSuggestions() {
    const trending = await this.prisma.trendingTopic.findMany({
      where: { isActive: true },
      orderBy: { score: "desc" },
      take: 8,
    })
    return {
      trending: trending.map((t) => ({
        type: "trending" as const,
        text: t.topic,
        meta: t.searchVolume > 0 ? `${t.searchVolume.toLocaleString()} searches` : undefined,
      })),
      hashtags: [],
      users: [],
      recent: [],
    }
  }

  async recordHistory(userId: string, query: string, searchType: string, resultCount = 0) {
    await this.prisma.searchHistory.create({
      data: { userId, query: query.slice(0, 200), searchType, resultCount },
    })
  }

  async getRecentSearches(userId: string, limit = 10) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      distinct: ["query"],
      take: limit,
      select: { query: true, searchType: true, createdAt: true },
    })
  }

  async clearHistory(userId: string) {
    await this.prisma.searchHistory.deleteMany({ where: { userId } })
    return { cleared: true }
  }
}
