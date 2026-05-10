import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { PrismaService } from "../common/prisma.service"
import type { Prisma } from "@prisma/client"

@Injectable()
export class OutfitsService {
  constructor(private prisma: PrismaService) {}

  async getFeed(params: {
    userId?: string
    cursor?: string
    limit?: number
    trending?: boolean
    following?: boolean
    style?: string
  }) {
    const limit = Math.min(params.limit ?? 24, 50)
    const where: Prisma.OutfitWhereInput = { isPublic: true }

    if (params.style) where.styles = { has: params.style as any }
    if (params.trending) where.isTrending = true
    if (params.following && params.userId) {
      const following = await this.prisma.follow.findMany({
        where: { followerId: params.userId },
        select: { followingId: true },
      })
      where.userId = { in: following.map((f) => f.followingId) }
    }

    const items = await this.prisma.outfit.findMany({
      where,
      orderBy: params.trending
        ? { viralityScore: "desc" }
        : { createdAt: "desc" },
      take: limit + 1,
      cursor: params.cursor ? { id: params.cursor } : undefined,
      skip: params.cursor ? 1 : 0,
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
    })

    const hasMore = items.length > limit
    const sliced = hasMore ? items.slice(0, -1) : items

    return {
      items: sliced,
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
      hasMore,
    }
  }

  async findById(id: string, viewerId?: string) {
    const outfit = await this.prisma.outfit.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      },
    })
    if (!outfit) throw new NotFoundException("Outfit not found")

    let isLiked = false
    let isSaved = false
    if (viewerId) {
      const [like, saved] = await Promise.all([
        this.prisma.like.findUnique({ where: { userId_outfitId: { userId: viewerId, outfitId: id } } }),
        this.prisma.savedOutfit.findUnique({ where: { userId_outfitId: { userId: viewerId, outfitId: id } } }),
      ])
      isLiked = !!like
      isSaved = !!saved
    }

    // Increment views (fire and forget)
    this.prisma.outfit
      .update({ where: { id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => {})

    return { ...outfit, isLiked, isSaved }
  }

  async create(userId: string, data: {
    title: string
    description?: string
    imageUrl: string
    thumbnailUrl?: string
    styles?: string[]
    tags?: string[]
    generationId?: string
    isPublic?: boolean
  }) {
    return this.prisma.outfit.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        styles: (data.styles ?? []) as any,
        tags: data.tags ?? [],
        generationId: data.generationId,
        isPublic: data.isPublic ?? true,
      },
    })
  }

  async toggleLike(userId: string, outfitId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_outfitId: { userId, outfitId } },
    })

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.like.delete({ where: { id: existing.id } }),
        this.prisma.outfit.update({
          where: { id: outfitId },
          data: { likesCount: { decrement: 1 } },
        }),
      ])
      return { liked: false }
    }

    await this.prisma.$transaction([
      this.prisma.like.create({ data: { userId, outfitId } }),
      this.prisma.outfit.update({
        where: { id: outfitId },
        data: { likesCount: { increment: 1 } },
      }),
    ])
    return { liked: true }
  }

  async toggleSave(userId: string, outfitId: string) {
    const existing = await this.prisma.savedOutfit.findUnique({
      where: { userId_outfitId: { userId, outfitId } },
    })

    if (existing) {
      await this.prisma.savedOutfit.delete({ where: { id: existing.id } })
      return { saved: false }
    }

    await this.prisma.savedOutfit.create({ data: { userId, outfitId } })
    return { saved: true }
  }

  async delete(userId: string, outfitId: string) {
    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } })
    if (!outfit) throw new NotFoundException()
    if (outfit.userId !== userId) throw new ForbiddenException()
    await this.prisma.outfit.delete({ where: { id: outfitId } })
    return { deleted: true }
  }

  // ─── Comments ──────────────────────────────────────────────

  async getComments(outfitId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { outfitId, parentId: null, isHidden: false },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          replies: {
            where: { isHidden: false },
            take: 3,
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({ where: { outfitId, parentId: null, isHidden: false } }),
    ])
    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async addComment(
    userId: string,
    outfitId: string,
    content: string,
    parentId?: string
  ) {
    const outfit = await this.prisma.outfit.findUnique({ where: { id: outfitId } })
    if (!outfit) throw new NotFoundException("Outfit not found")

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { userId, outfitId, content: content.trim().slice(0, 1000), parentId },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
      }),
      this.prisma.outfit.update({
        where: { id: outfitId },
        data: { commentsCount: { increment: 1 } },
      }),
      ...(outfit.userId !== userId
        ? [
            this.prisma.notification.create({
              data: {
                userId: outfit.userId,
                type: "COMMENT" as const,
                title: "New comment",
                body: content.slice(0, 100),
                actorId: userId,
                entityId: outfitId,
                entityType: "outfit",
              },
            }),
          ]
        : []),
    ])

    return comment
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) throw new NotFoundException()
    if (comment.userId !== userId) throw new ForbiddenException()

    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.outfit.update({
        where: { id: comment.outfitId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ])
    return { deleted: true }
  }
}
