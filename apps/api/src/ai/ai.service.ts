import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectQueue } from "@nestjs/bull"
import type { Queue } from "bull"
import OpenAI from "openai"
import Replicate from "replicate"
import { Prisma } from "@prisma/client"
import { PrismaService } from "../common/prisma.service"
import { StorageService } from "../common/storage.service"
import { RedisService } from "../common/redis.service"
import type {
  GenerateOutfitRequest,
  VirtualTryOnRequest,
  BrandDesignRequest,
  StyleCategory,
} from "@stylesnap/types"

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private _openai: OpenAI | null = null
  private _replicate: Replicate | null = null

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private redis: RedisService,
    private config: ConfigService,
    @InjectQueue("ai-generation") private generationQueue: Queue
  ) {}

  /** Lazy OpenAI client — throws only when called without OPENAI_API_KEY set. */
  private get openai(): OpenAI {
    if (!this._openai) {
      const key = this.config.get<string>("ai.openaiApiKey")
      if (!key) {
        throw new BadRequestException(
          "OpenAI is not configured. Set OPENAI_API_KEY in your .env to enable AI generation."
        )
      }
      this._openai = new OpenAI({ apiKey: key })
    }
    return this._openai
  }

  /** Lazy Replicate client — throws only when called without REPLICATE_API_TOKEN set. */
  private get replicate(): Replicate {
    if (!this._replicate) {
      const token = this.config.get<string>("ai.replicateToken")
      if (!token) {
        throw new BadRequestException(
          "Replicate is not configured. Set REPLICATE_API_TOKEN in your .env to enable image-to-image generation."
        )
      }
      this._replicate = new Replicate({ auth: token })
    }
    return this._replicate
  }

  async generateOutfit(userId: string, dto: GenerateOutfitRequest) {
    await this.checkGenerationQuota(userId)

    const generation = await this.prisma.aiGeneration.create({
      data: {
        userId,
        mode: "OUTFIT",
        status: "QUEUED",
        inputImageUrl: dto.inputImageUrl,
        styleCategory: dto.styleCategory,
        creativity: dto.creativity ?? 0.7,
        customParams: {
          mode: dto.mode ?? "standard",
          variants: dto.generateVariants ?? 3,
        },
      },
    })

    await this.generationQueue.add(
      "outfit",
      { generationId: generation.id, userId, dto },
      { priority: await this.getUserPriority(userId), attempts: 3, backoff: 5000 }
    )

    return generation
  }

  async processOutfitGeneration(generationId: string, userId: string, dto: GenerateOutfitRequest) {
    await this.updateStatus(generationId, "PROCESSING")
    const startTime = Date.now()

    try {
      const stylePrompt = await this.buildStylePrompt(dto.styleCategory, dto.mode)
      const outputImages: string[] = []
      const variants = Math.min(dto.generateVariants ?? 3, 4)

      if (dto.inputImageUrl) {
        this.logger.log(`Using Replicate (image-to-image, ${dto.inputImageUrl.length} chars)`)
        // Use SDXL + ControlNet for face-preserving generation
        for (let i = 0; i < variants; i++) {
          const output = await this.replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
              input: {
                image: dto.inputImageUrl,
                prompt: `${stylePrompt}, ultra realistic fashion photography, professional studio, 8k, hyperdetailed`,
                negative_prompt:
                  "ugly, deformed, blurry, low quality, watermark, text, cartoon, anime",
                num_inference_steps: 50,
                guidance_scale: 7.5 + (dto.creativity ?? 0.7) * 4,
                strength: 0.55 + (dto.creativity ?? 0.7) * 0.25,
                seed: Math.floor(Math.random() * 999999),
              },
            }
          )

          const imageUrl = Array.isArray(output) ? (output[0] as unknown as string) : (output as unknown as string)
          const response = await fetch(imageUrl)
          const buffer = Buffer.from(await response.arrayBuffer())
          const { url } = await this.storage.uploadImage(buffer, {
            folder: "generations/outfits",
            userId,
            maxWidth: 1024,
          })
          outputImages.push(url)
        }
      } else {
        this.logger.log(`Using OpenAI DALL·E 3 (no input image)`)
        // Text-to-image mode
        const response = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: `Fashion editorial photo: ${stylePrompt}. Ultra realistic, magazine quality, 2026 trends.`,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "vivid",
        })

        const imageUrl = response.data?.[0]?.url
        if (imageUrl) {
          const imgResponse = await fetch(imageUrl)
          const buffer = Buffer.from(await imgResponse.arrayBuffer())
          const { url } = await this.storage.uploadImage(buffer, {
            folder: "generations/outfits",
            userId,
            maxWidth: 1024,
          })
          outputImages.push(url)
        }
      }

      const viralityScore = await this.predictViralityScore(dto.styleCategory, outputImages[0])

      await this.prisma.aiGeneration.update({
        where: { id: generationId },
        data: {
          status: "COMPLETED",
          outputImages,
          metadata: { viralityScore },
          generationTime: Date.now() - startTime,
          provider: dto.inputImageUrl ? "replicate" : "openai",
        },
      })

      await this.incrementUsage(userId)
      return { generationId, outputImages, viralityScore }
    } catch (err) {
      this.logger.error(`Generation failed: ${generationId}`, err)
      await this.prisma.aiGeneration.update({
        where: { id: generationId },
        data: {
          status: "FAILED",
          errorMessage: err instanceof Error ? err.message : "Unknown error",
        },
      })
      throw err
    }
  }

  async virtualTryOn(userId: string, dto: VirtualTryOnRequest) {
    await this.checkGenerationQuota(userId, "VIRTUAL_TRYON")

    const generation = await this.prisma.aiGeneration.create({
      data: {
        userId,
        mode: "VIRTUAL_TRYON",
        status: "QUEUED",
        inputImageUrl: dto.personImageUrl,
        customParams: dto as unknown as Prisma.InputJsonValue,
      },
    })

    await this.generationQueue.add(
      "tryon",
      { generationId: generation.id, userId, dto },
      { priority: 5, attempts: 3 }
    )

    return generation
  }

  async processTryOn(generationId: string, userId: string, dto: VirtualTryOnRequest) {
    await this.updateStatus(generationId, "PROCESSING")
    const startTime = Date.now()

    try {
      // Use FASHN.ai or IDM-VTON for virtual try-on
      const output = await this.replicate.run(
        "cuuupid/idm-vton:906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
        {
          input: {
            human_img: dto.personImageUrl,
            garm_img: dto.garmentImageUrl,
            garment_des: dto.garmentType,
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42,
          },
        }
      )

      const imageUrl = Array.isArray(output) ? (output[0] as unknown as string) : (output as unknown as string)
      const response = await fetch(imageUrl)
      const buffer = Buffer.from(await response.arrayBuffer())
      const { url } = await this.storage.uploadImage(buffer, {
        folder: "generations/tryon",
        userId,
        maxWidth: 1024,
      })

      await this.prisma.aiGeneration.update({
        where: { id: generationId },
        data: {
          status: "COMPLETED",
          outputImages: [url],
          generationTime: Date.now() - startTime,
          provider: "replicate",
        },
      })

      await this.incrementUsage(userId)
      return { generationId, outputImages: [url] }
    } catch (err) {
      await this.prisma.aiGeneration.update({
        where: { id: generationId },
        data: { status: "FAILED", errorMessage: err instanceof Error ? err.message : "Error" },
      })
      throw err
    }
  }

  async generateBrandDesign(userId: string, dto: BrandDesignRequest) {
    await this.checkPremiumAccess(userId)

    const templates: Record<string, string> = {
      hoodie: "pullover hoodie flat lay product photo, white background, minimalist streetwear",
      tshirt: "t-shirt flat lay product photo, white background, clean design",
      sneakers: "sneaker product photo, white background, lifestyle photography",
      logo: "streetwear brand logo, vector style, minimal, modern typography",
      collection: "fashion lookbook spread, multiple pieces, editorial layout",
    }

    const basePrompt = templates[dto.type] ?? "fashion design"
    const fullPrompt = `${basePrompt}, ${dto.prompt}, ${dto.styleCategory ?? "streetwear"} aesthetic, ${dto.colorPalette?.join(", ") ?? "neutral tones"}, professional product photography, 8k ultra detail`

    const response = await this.openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) throw new BadRequestException("Generation failed")

    const imgResponse = await fetch(imageUrl)
    const buffer = Buffer.from(await imgResponse.arrayBuffer())
    const { url } = await this.storage.uploadImage(buffer, {
      folder: "generations/brand",
      userId,
      maxWidth: 2048,
      quality: 95,
    })

    const generation = await this.prisma.aiGeneration.create({
      data: {
        userId,
        mode: "BRAND_DESIGN",
        status: "COMPLETED",
        inputPrompt: dto.prompt,
        styleCategory: dto.styleCategory,
        outputImages: [url],
        customParams: dto as unknown as Prisma.InputJsonValue,
        provider: "openai",
      },
    })

    return generation
  }

  async getRecommendations(userId: string) {
    const cacheKey = `recommendations:${userId}`
    const cached = await this.redis.getJson<unknown[]>(cacheKey)
    if (cached) return cached

    const [user, recentGenerations, trendingOutfits] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { favoriteStyles: true, fashionLevel: true },
      }),
      this.prisma.aiGeneration.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { styleCategory: true, metadata: true },
      }),
      this.prisma.outfit.findMany({
        where: { isPublic: true, isTrending: true },
        orderBy: { viralityScore: "desc" },
        take: 20,
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } },
      }),
    ])

    const recommendations = {
      trending: trendingOutfits.slice(0, 10),
      forYou: trendingOutfits.filter((o) =>
        o.styles.some((s) => user?.favoriteStyles.includes(s))
      ).slice(0, 10),
      styles: user?.favoriteStyles ?? [],
    }

    await this.redis.setJson(cacheKey, recommendations, 300)
    return recommendations
  }

  async getTrends() {
    const cacheKey = "style-trends:global"
    const cached = await this.redis.getJson<unknown>(cacheKey)
    if (cached) return cached

    const trends = await this.prisma.styleTrend.findMany({
      where: { isActive: true },
      orderBy: { trendScore: "desc" },
      take: 20,
    })

    await this.redis.setJson(cacheKey, trends, 3600)
    return trends
  }

  async getGeneration(id: string, userId: string) {
    const gen = await this.prisma.aiGeneration.findUnique({ where: { id } })
    if (!gen) throw new NotFoundException("Generation not found")
    if (gen.userId !== userId) throw new ForbiddenException()
    return gen
  }

  async getUserGenerations(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.aiGeneration.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiGeneration.count({ where: { userId } }),
    ])
    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  private async buildStylePrompt(style: StyleCategory, mode?: string): Promise<string> {
    const styleGuides: Partial<Record<StyleCategory, string>> = {
      STREETWEAR: "urban streetwear outfit, oversized hoodie, cargo pants, sneakers, bold colors",
      LUXURY: "luxury fashion outfit, designer pieces, Hermès, Chanel, Louis Vuitton vibes, elegant",
      OLD_MONEY: "old money aesthetic, preppy, blazer, chinos, loafers, muted earth tones",
      TECHWEAR: "techwear outfit, tactical, functional, ACRONYM aesthetic, dark colors, zippers",
      Y2K: "y2k fashion, early 2000s vibes, low rise, butterfly clips, chrome, pastel",
      MINIMAL: "minimalist fashion, clean lines, neutral palette, Celine, The Row aesthetic",
      VINTAGE: "vintage fashion, thrifted aesthetic, 70s/90s inspired, unique pieces",
      ANIME: "anime-inspired fashion, Harajuku, colorful, unique accessories, Japanese street style",
      CYBERPUNK: "cyberpunk fashion, neon accents, futuristic, dystopian aesthetic, metallic",
    }

    const base = styleGuides[style] ?? `${style.toLowerCase().replace("_", " ")} fashion outfit`
    const modeModifiers: Record<string, string> = {
      viral_tiktok: "TikTok viral look, trendy, shareable, eye-catching",
      luxury: "ultra luxury, exclusive, high fashion editorial",
      budget: "affordable fashion, high street, accessible luxury look",
      designer: "designer collaboration, limited edition, exclusive",
    }

    return `${base}${mode && mode !== "standard" ? `, ${modeModifiers[mode] ?? ""}` : ""}`
  }

  private async predictViralityScore(style: StyleCategory, imageUrl?: string): Promise<number> {
    const trendingStyles: StyleCategory[] = ["Y2K", "STREETWEAR", "TECHWEAR", "OLD_MONEY"]
    const base = trendingStyles.includes(style) ? 0.7 : 0.4
    return Math.min(1, base + Math.random() * 0.3)
  }

  private async checkGenerationQuota(
    userId: string,
    mode: string = "OUTFIT"
  ): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } })
    if (!sub) throw new ForbiddenException("No subscription found")

    if (sub.tier === "FREE") {
      const today = new Date()
      const resetDate = new Date(sub.generationsResetAt)

      if (today.toDateString() !== resetDate.toDateString()) {
        await this.prisma.subscription.update({
          where: { userId },
          data: { generationsUsedToday: 0, generationsResetAt: today },
        })
        return
      }

      if (sub.generationsUsedToday >= 5) {
        throw new ForbiddenException("Daily generation limit reached. Upgrade to Premium for unlimited generations.")
      }

      if (mode === "VIRTUAL_TRYON") {
        throw new ForbiddenException("Virtual try-on requires Premium or VIP subscription.")
      }
    }
  }

  private async checkPremiumAccess(userId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } })
    if (!sub || sub.tier === "FREE") {
      throw new ForbiddenException("Brand design tools require VIP subscription.")
    }
  }

  private async incrementUsage(userId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { userId },
      data: {
        generationsUsedToday: { increment: 1 },
        totalGenerations: { increment: 1 },
      },
    })
  }

  private async getUserPriority(userId: string): Promise<number> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { tier: true },
    })
    const priorities: Record<string, number> = { VIP: 1, PREMIUM: 5, FREE: 10 }
    return priorities[sub?.tier ?? "FREE"]
  }

  private async updateStatus(id: string, status: string) {
    await this.prisma.aiGeneration.update({
      where: { id },
      data: { status: status as any },
    })
  }
}
