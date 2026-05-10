import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { PrismaService } from "../common/prisma.service"
import type { User } from "@prisma/client"

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    })
    if (!user) throw new NotFoundException("User not found")
    return this.sanitize(user)
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { subscription: { select: { tier: true, status: true } } },
    })
    if (!user) throw new NotFoundException("User not found")
    return this.sanitize(user)
  }

  async updateProfile(userId: string, data: Partial<User>) {
    const allowed = [
      "displayName", "bio", "avatarUrl", "bannerUrl",
      "gender", "location", "website", "clothingSize", "shoeSize",
      "favoriteStyles", "favoriteBrands", "budgetRange",
    ] as const

    const update: any = {}
    for (const key of allowed) {
      if (key in data) update[key] = (data as any)[key]
    }

    const user = await this.prisma.user.update({ where: { id: userId }, data: update })
    return this.sanitize(user)
  }

  async completeOnboarding(userId: string, data: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        gender: data.gender,
        clothingSize: data.clothingSize,
        shoeSize: data.shoeSize,
        favoriteStyles: data.favoriteStyles ?? [],
        favoriteBrands: data.favoriteBrands ?? [],
        budgetRange: data.budgetRange,
        styleInspirations: data.styleInspirations ?? [],
        onboardingCompleted: true,
      },
    })
    return this.sanitize(user)
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ForbiddenException("Cannot follow yourself")
    }

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.follow.delete({ where: { id: existing.id } }),
        this.prisma.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } }),
        this.prisma.user.update({ where: { id: followingId }, data: { followersCount: { decrement: 1 } } }),
      ])
      return { following: false }
    }

    await this.prisma.$transaction([
      this.prisma.follow.create({ data: { followerId, followingId } }),
      this.prisma.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } }),
      this.prisma.user.update({ where: { id: followingId }, data: { followersCount: { increment: 1 } } }),
    ])
    return { following: true }
  }

  /**
   * Strip sensitive fields before sending to client.
   */
  sanitize(user: User & { subscription?: any }) {
    const { passwordHash, googleId, appleId, tiktokId, ...safe } = user
    return safe
  }
}
