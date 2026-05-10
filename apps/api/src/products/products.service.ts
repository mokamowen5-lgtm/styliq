import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../common/prisma.service"
import { RedisService } from "../common/redis.service"
import type { Prisma } from "@prisma/client"

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  async list(params: {
    page?: number
    limit?: number
    category?: string
    style?: string
    minPrice?: number
    maxPrice?: number
    brand?: string
    sort?: "newest" | "popular" | "price_asc" | "price_desc"
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 24, 50)
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = { isAvailable: true }
    if (params.category) where.category = params.category as any
    if (params.style) where.styles = { has: params.style as any }
    if (params.brand) where.brand = params.brand
    if (params.minPrice || params.maxPrice) {
      where.price = {}
      if (params.minPrice) where.price.gte = params.minPrice
      if (params.maxPrice) where.price.lte = params.maxPrice
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      params.sort === "popular"
        ? { purchasesCount: "desc" }
        : params.sort === "price_asc"
        ? { price: "asc" }
        : params.sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { colors: true },
      }),
      this.prisma.product.count({ where }),
    ])

    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const cacheKey = `product:${id}`
    const cached = await this.redis.getJson<unknown>(cacheKey)
    if (cached) return cached

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { colors: true, creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    })
    if (!product) throw new NotFoundException("Product not found")

    // Increment views (fire & forget)
    this.prisma.product
      .update({ where: { id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => {})

    await this.redis.setJson(cacheKey, product, 300)
    return product
  }

  async search(query: string, limit = 20) {
    const trimmed = query.trim()
    if (trimmed.length < 2) return { items: [] }

    const items = await this.prisma.product.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { brand: { contains: trimmed, mode: "insensitive" } },
          { tags: { has: trimmed.toLowerCase() } },
        ],
      },
      orderBy: [{ purchasesCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: { colors: true },
    })

    return { items }
  }

  async getRecommendations(userId: string, limit = 12) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { favoriteStyles: true, favoriteBrands: true, budgetRange: true },
    })
    if (!user) return { items: [] }

    const where: Prisma.ProductWhereInput = { isAvailable: true }
    if (user.favoriteStyles.length > 0) {
      where.styles = { hasSome: user.favoriteStyles as any }
    }
    if (user.favoriteBrands.length > 0) {
      where.brand = { in: user.favoriteBrands }
    }

    const items = await this.prisma.product.findMany({
      where,
      orderBy: [{ rating: "desc" }, { purchasesCount: "desc" }],
      take: limit,
      include: { colors: true },
    })

    return { items }
  }
}
