import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../common/prisma.service"

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      premiumUsers,
      vipUsers,
      totalGenerations,
      generationsToday,
      totalOutfits,
      pendingReports,
      mrrAggregate,
      newUsersToday,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true, isBanned: false } }),
      this.prisma.subscription.count({ where: { tier: "PREMIUM", status: "ACTIVE" } }),
      this.prisma.subscription.count({ where: { tier: "VIP", status: "ACTIVE" } }),
      this.prisma.aiGeneration.count(),
      this.prisma.aiGeneration.count({
        where: { createdAt: { gte: this.startOfDay() } },
      }),
      this.prisma.outfit.count({ where: { isPublic: true } }),
      this.prisma.report.count({ where: { isResolved: false } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: this.daysAgo(30) },
          status: "succeeded",
        },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: this.startOfDay() } } }),
    ])

    return {
      totalUsers,
      premiumUsers: premiumUsers + vipUsers,
      vipUsers,
      totalGenerations,
      generationsToday,
      totalOutfits,
      pendingReports,
      newUsersToday,
      mrr: mrrAggregate._sum.amount ?? 0,
    }
  }

  async listUsers(params: {
    page?: number
    limit?: number
    sort?: string
    search?: string
    role?: string
    tier?: string
  }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 30, 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { username: { contains: params.search, mode: "insensitive" } },
        { displayName: { contains: params.search, mode: "insensitive" } },
      ]
    }
    if (params.role) where.role = params.role
    if (params.tier) where.subscription = { tier: params.tier }

    const orderBy: any = { createdAt: "desc" }
    if (params.sort) {
      const [field, direction] = params.sort.split(":")
      orderBy[field] = direction === "asc" ? "asc" : "desc"
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { subscription: { select: { tier: true, status: true } } },
      }),
      this.prisma.user.count({ where }),
    ])

    // Strip sensitive fields before sending to admin
    const safeItems = items.map(({ passwordHash, googleId, appleId, tiktokId, ...u }) => u)

    return { items: safeItems, total, page, totalPages: Math.ceil(total / limit) }
  }

  async banUser(userId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException("User not found")

    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: true, bannedReason: reason, isActive: false },
    })
  }

  async unbanUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, bannedReason: null, isActive: true },
    })
  }

  async listReports(params: { page?: number; limit?: number; resolved?: boolean }) {
    const page = params.page ?? 1
    const limit = Math.min(params.limit ?? 30, 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.resolved !== undefined) where.isResolved = params.resolved

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          reporter: { select: { id: true, username: true } },
          reported: { select: { id: true, username: true } },
          outfit: { select: { id: true, imageUrl: true, title: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ])

    return { items, total, page, totalPages: Math.ceil(total / limit) }
  }

  async resolveReport(reportId: string, action: "dismiss" | "remove_content" | "ban_user", note?: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } })
    if (!report) throw new NotFoundException("Report not found")

    if (action === "remove_content" && report.outfitId) {
      await this.prisma.outfit.delete({ where: { id: report.outfitId } })
    }

    if (action === "ban_user" && report.reportedId) {
      await this.banUser(report.reportedId, note ?? "Banned via report")
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { isResolved: true, resolvedAt: new Date(), adminNote: note },
    })
  }

  async getGenerationActivity(days = 7) {
    const since = this.daysAgo(days)
    const generations = await this.prisma.aiGeneration.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    })

    // Group by day
    const buckets: Record<string, { total: number; completed: number; failed: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const day = this.daysAgo(i).toISOString().split("T")[0]
      buckets[day] = { total: 0, completed: 0, failed: 0 }
    }

    for (const gen of generations) {
      const day = gen.createdAt.toISOString().split("T")[0]
      if (buckets[day]) {
        buckets[day].total++
        if (gen.status === "COMPLETED") buckets[day].completed++
        else if (gen.status === "FAILED") buckets[day].failed++
      }
    }

    return Object.entries(buckets).map(([date, stats]) => ({ date, ...stats }))
  }

  // ─── Helpers ────────────────────────────────────────────────

  private startOfDay() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  private daysAgo(days: number) {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(0, 0, 0, 0)
    return d
  }
}
