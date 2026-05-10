import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from "@nestjs/common"
import { PrismaService } from "../common/prisma.service"
import { RedisService } from "../common/redis.service"
import type { Prisma, BoardCategory, BoardVisibility } from "@prisma/client"

interface CreateBoardDto {
  name: string
  description?: string
  category?: BoardCategory
  visibility?: BoardVisibility
  styles?: string[]
  tags?: string[]
  colorPalette?: string[]
  isSmart?: boolean
  smartRules?: Record<string, unknown>
  coverImageUrl?: string
}

@Injectable()
export class BoardsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────

  async create(ownerId: string, dto: CreateBoardDto) {
    const slug = this.slugify(dto.name)

    const exists = await this.prisma.board.findUnique({
      where: { ownerId_slug: { ownerId, slug } },
    })
    if (exists) throw new ConflictException("You already have a board with this name")

    const board = await this.prisma.board.create({
      data: {
        ownerId,
        name: dto.name.trim(),
        slug,
        description: dto.description,
        category: dto.category ?? "MOODBOARD",
        visibility: dto.visibility ?? "PUBLIC",
        styles: (dto.styles ?? []) as any,
        tags: dto.tags ?? [],
        colorPalette: dto.colorPalette ?? [],
        isSmart: dto.isSmart ?? false,
        smartRules: dto.smartRules as Prisma.InputJsonValue,
        coverImageUrl: dto.coverImageUrl,
      },
    })

    await this.redis.invalidatePattern(`boards:user:${ownerId}*`)
    return board
  }

  async list(params: {
    userId?: string                // viewer
    ownerId?: string                // filter by owner
    category?: BoardCategory
    visibility?: BoardVisibility
    page?: number
    limit?: number
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 24, 50)
    const skip = (page - 1) * limit

    const where: Prisma.BoardWhereInput = {}

    if (params.ownerId) {
      where.ownerId = params.ownerId
      // If viewer != owner, hide private/secret boards
      if (params.userId !== params.ownerId) {
        where.visibility = { in: ["PUBLIC", "COLLAB"] }
      }
    } else {
      where.visibility = "PUBLIC"
    }

    if (params.category) where.category = params.category
    if (params.visibility) where.visibility = params.visibility

    const [items, total] = await Promise.all([
      this.prisma.board.findMany({
        where,
        orderBy: [{ followersCount: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
          },
          items: {
            take: 4,
            orderBy: { position: "asc" },
            include: {
              outfit: { select: { id: true, imageUrl: true, thumbnailUrl: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.board.count({ where }),
    ])

    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string, viewerId?: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
        collaborators: {
          include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        },
        _count: { select: { items: true } },
      },
    })
    if (!board) throw new NotFoundException("Board not found")

    // Visibility check
    if (board.visibility === "PRIVATE" && board.ownerId !== viewerId) {
      throw new ForbiddenException("This board is private")
    }
    if (board.visibility === "SECRET" && board.ownerId !== viewerId) {
      const isCollab = board.collaborators.some((c) => c.userId === viewerId)
      if (!isCollab) throw new ForbiddenException("This board is secret")
    }

    // Increment views (fire-and-forget)
    this.prisma.board
      .update({ where: { id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => {})

    return board
  }

  async getItems(boardId: string, viewerId: string | undefined, page = 1, limit = 24) {
    await this.findOne(boardId, viewerId)
    const skip = (page - 1) * limit

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { isSmart: true, smartRules: true, styles: true, tags: true },
    })

    if (board?.isSmart) {
      // Smart boards: dynamically fetch outfits matching the rules
      return this.querySmartItems(board, page, limit)
    }

    const [items, total] = await Promise.all([
      this.prisma.boardItem.findMany({
        where: { boardId },
        orderBy: { position: "asc" },
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
      }),
      this.prisma.boardItem.count({ where: { boardId } }),
    ])

    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async update(boardId: string, userId: string, dto: Partial<CreateBoardDto>) {
    await this.assertCanEdit(boardId, userId)

    const data: Prisma.BoardUpdateInput = {}
    if (dto.name !== undefined) {
      data.name = dto.name
      data.slug = this.slugify(dto.name)
    }
    if (dto.description !== undefined) data.description = dto.description
    if (dto.category !== undefined) data.category = dto.category
    if (dto.visibility !== undefined) data.visibility = dto.visibility
    if (dto.styles !== undefined) data.styles = { set: dto.styles as any }
    if (dto.tags !== undefined) data.tags = { set: dto.tags }
    if (dto.colorPalette !== undefined) data.colorPalette = { set: dto.colorPalette }
    if (dto.coverImageUrl !== undefined) data.coverImageUrl = dto.coverImageUrl
    if (dto.smartRules !== undefined) data.smartRules = dto.smartRules as Prisma.InputJsonValue

    const board = await this.prisma.board.update({ where: { id: boardId }, data })
    await this.redis.invalidatePattern(`board:${boardId}*`)
    return board
  }

  async delete(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } })
    if (!board) throw new NotFoundException()
    if (board.ownerId !== userId) throw new ForbiddenException()
    await this.prisma.board.delete({ where: { id: boardId } })
    return { deleted: true }
  }

  // ─── Items management ──────────────────────────────────────

  async addItem(boardId: string, userId: string, outfitId: string, note?: string) {
    await this.assertCanEdit(boardId, userId)

    const exists = await this.prisma.boardItem.findUnique({
      where: { boardId_outfitId: { boardId, outfitId } },
    })
    if (exists) throw new ConflictException("Outfit already in this board")

    // Find next position
    const last = await this.prisma.boardItem.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    })

    const [item] = await this.prisma.$transaction([
      this.prisma.boardItem.create({
        data: {
          boardId,
          outfitId,
          addedById: userId,
          position: (last?.position ?? -1) + 1,
          note,
        },
      }),
      this.prisma.board.update({
        where: { id: boardId },
        data: { itemsCount: { increment: 1 } },
      }),
      this.prisma.outfit.update({
        where: { id: outfitId },
        data: { savesCount: { increment: 1 } },
      }),
    ])

    await this.redis.invalidatePattern(`board:${boardId}*`)
    return item
  }

  async removeItem(boardId: string, userId: string, outfitId: string) {
    await this.assertCanEdit(boardId, userId)

    const item = await this.prisma.boardItem.findUnique({
      where: { boardId_outfitId: { boardId, outfitId } },
    })
    if (!item) throw new NotFoundException()

    await this.prisma.$transaction([
      this.prisma.boardItem.delete({ where: { id: item.id } }),
      this.prisma.board.update({
        where: { id: boardId },
        data: { itemsCount: { decrement: 1 } },
      }),
    ])

    return { removed: true }
  }

  /**
   * Reorder items via drag & drop. Accepts the full new ordering.
   */
  async reorderItems(boardId: string, userId: string, orderedItemIds: string[]) {
    await this.assertCanEdit(boardId, userId)

    await this.prisma.$transaction(
      orderedItemIds.map((id, position) =>
        this.prisma.boardItem.update({ where: { id }, data: { position } })
      )
    )

    await this.redis.invalidatePattern(`board:${boardId}*`)
    return { reordered: true }
  }

  // ─── Collaborators ─────────────────────────────────────────

  async invite(boardId: string, ownerId: string, userId: string, canEdit = true) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } })
    if (!board) throw new NotFoundException()
    if (board.ownerId !== ownerId) throw new ForbiddenException()

    const collab = await this.prisma.boardCollaborator.upsert({
      where: { boardId_userId: { boardId, userId } },
      create: { boardId, userId, canEdit },
      update: { canEdit },
    })

    // Notify the invitee
    await this.prisma.notification.create({
      data: {
        userId,
        type: "BOARD_INVITE",
        title: "You've been invited to a board",
        body: `Collaborate on "${board.name}"`,
        actorId: ownerId,
        entityId: boardId,
        entityType: "board",
      },
    })

    return collab
  }

  async acceptInvite(boardId: string, userId: string) {
    return this.prisma.boardCollaborator.update({
      where: { boardId_userId: { boardId, userId } },
      data: { acceptedAt: new Date() },
    })
  }

  async removeCollaborator(boardId: string, ownerId: string, userId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } })
    if (!board || board.ownerId !== ownerId) throw new ForbiddenException()
    await this.prisma.boardCollaborator.delete({
      where: { boardId_userId: { boardId, userId } },
    })
    return { removed: true }
  }

  // ─── Helpers ───────────────────────────────────────────────

  private async assertCanEdit(boardId: string, userId: string): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { collaborators: { where: { userId, canEdit: true } } },
    })
    if (!board) throw new NotFoundException("Board not found")
    if (board.ownerId === userId) return
    if (board.collaborators.length > 0) return
    throw new ForbiddenException("You cannot edit this board")
  }

  private async querySmartItems(
    board: { smartRules: Prisma.JsonValue; styles: string[]; tags: string[] },
    page: number,
    limit: number
  ) {
    const rules = (board.smartRules as Record<string, any>) ?? {}
    const skip = (page - 1) * limit

    const where: Prisma.OutfitWhereInput = {
      isPublic: true,
    }
    if (board.styles?.length) where.styles = { hasSome: board.styles as any }
    if (rules.minVirality) where.viralityScore = { gte: rules.minVirality }

    const [outfits, total] = await Promise.all([
      this.prisma.outfit.findMany({
        where,
        orderBy: { viralityScore: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
          },
        },
      }),
      this.prisma.outfit.count({ where }),
    ])

    return {
      items: outfits.map((outfit) => ({
        id: `smart-${outfit.id}`,
        outfit,
        outfitId: outfit.id,
        position: 0,
        note: null,
        createdAt: outfit.createdAt,
        addedById: null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      isSmart: true,
    }
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `board-${Date.now()}`
  }
}
