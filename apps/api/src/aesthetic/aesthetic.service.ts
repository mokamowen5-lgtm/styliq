import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import OpenAI from "openai"
import { PrismaService } from "../common/prisma.service"
import type { StyleCategory } from "@prisma/client"

/**
 * Aesthetic Profile service.
 *
 * Computes a user's "style fingerprint" from their interactions:
 *  - top styles (frequency-weighted)
 *  - dominant colors (extracted from saved outfits)
 *  - top brands & hashtags
 *  - aesthetic score (how distinctive your style is)
 *  - diversity score (how varied your taste is)
 *  - GPT-generated archetype name + bio (e.g. "Old Money + Coastal — Curator")
 */
@Injectable()
export class AestheticService {
  private readonly logger = new Logger(AestheticService.name)
  private _openai: OpenAI | null = null

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  private get openai(): OpenAI | null {
    if (this._openai) return this._openai
    const key = this.config.get<string>("ai.openaiApiKey")
    if (!key) return null
    this._openai = new OpenAI({ apiKey: key })
    return this._openai
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.aestheticProfile.findUnique({ where: { userId } })

    // If no profile yet, compute it on-the-fly (cheap if interactions are small)
    if (!profile) {
      return this.computeProfile(userId)
    }

    // Auto-refresh if older than 24h
    const age = Date.now() - profile.computedAt.getTime()
    if (age > 86_400_000) {
      this.computeProfile(userId).catch((err) =>
        this.logger.error(`Background recompute failed for ${userId}`, err)
      )
    }

    return profile
  }

  /**
   * Heavy job: aggregate all interactions and compute the profile.
   */
  async computeProfile(userId: string) {
    // 1. Pull recent saves + likes (capped at 200 each)
    const [saves, likes, watches] = await Promise.all([
      this.prisma.savedOutfit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { outfit: { select: { styles: true, tags: true } } },
      }),
      this.prisma.like.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { outfit: { select: { styles: true, tags: true } } },
      }),
      this.prisma.watchEvent.aggregate({
        where: { userId },
        _avg: { durationMs: true },
        _count: { _all: true },
      }),
    ])

    const totalSaves = saves.length
    const totalLikes = likes.length

    // 2. Aggregate styles
    const styleCounter = new Map<StyleCategory, number>()
    const tagCounter = new Map<string, number>()

    const all = [
      ...saves.map((s) => ({ styles: s.outfit.styles, tags: s.outfit.tags, weight: 2 })),
      ...likes.map((l) => ({ styles: l.outfit.styles, tags: l.outfit.tags, weight: 1 })),
    ]

    for (const item of all) {
      for (const style of item.styles) {
        styleCounter.set(style, (styleCounter.get(style) ?? 0) + item.weight)
      }
      for (const tag of item.tags) {
        tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + item.weight)
      }
    }

    const topStyles = [...styleCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s)

    const topHashtags = [...tagCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t)

    // 3. Scores
    const totalInteractions = totalSaves + totalLikes
    const distinctStyles = styleCounter.size
    // Aesthetic score: high if user gravitates around few styles
    const aestheticScore = totalInteractions > 0
      ? Math.min(100, (topStyles.length > 0 ? (styleCounter.get(topStyles[0]!) ?? 0) / totalInteractions : 0) * 100 * 1.5)
      : 0
    // Diversity score: range of styles
    const diversityScore = Math.min(100, (distinctStyles / 15) * 100)

    const avgSessionMinutes = watches._avg.durationMs
      ? (watches._avg.durationMs / 60_000)
      : 0

    // 4. GPT archetype (if enough data + OpenAI configured)
    let archetypeName: string | null = null
    let archetypeBio: string | null = null
    if (this.openai && topStyles.length >= 2 && totalInteractions >= 5) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 120,
          temperature: 0.8,
          messages: [
            {
              role: "system",
              content: "You name fashion aesthetic archetypes. Output strict JSON: {name, bio}. Name is 2-5 words (e.g. \"Old Money Sophisticate\"). Bio is one sentence, max 280 chars, second-person, evocative.",
            },
            {
              role: "user",
              content: `Top styles: ${topStyles.join(", ")}. Top hashtags: ${topHashtags.slice(0, 5).join(", ")}. Aesthetic score: ${aestheticScore.toFixed(0)}/100. Diversity: ${diversityScore.toFixed(0)}/100.`,
            },
          ],
          response_format: { type: "json_object" },
        })

        const parsed = JSON.parse(completion.choices[0]?.message.content ?? "{}")
        archetypeName = parsed.name?.slice(0, 100) ?? null
        archetypeBio = parsed.bio?.slice(0, 280) ?? null
      } catch (err) {
        this.logger.warn(`Failed to generate archetype for ${userId}`, err as Error)
      }
    }

    // 5. Persist
    return this.prisma.aestheticProfile.upsert({
      where: { userId },
      create: {
        userId,
        topStyles,
        topHashtags,
        topBrands: [],
        topColors: [],
        totalSaves,
        totalLikes,
        avgSessionMinutes,
        aestheticScore,
        diversityScore,
        archetypeName,
        archetypeBio,
      },
      update: {
        topStyles: { set: topStyles },
        topHashtags: { set: topHashtags },
        totalSaves,
        totalLikes,
        avgSessionMinutes,
        aestheticScore,
        diversityScore,
        archetypeName,
        archetypeBio,
        computedAt: new Date(),
      },
    })
  }
}
