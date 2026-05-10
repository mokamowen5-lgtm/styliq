import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import * as argon2 from "argon2"
import { nanoid } from "nanoid"
import { PrismaService } from "../common/prisma.service"
import { RedisService } from "../common/redis.service"
import { UsersService } from "../users/users.service"
import type { RegisterRequest, LoginRequest, AuthTokens } from "@stylesnap/types"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private users: UsersService
  ) {}

  async register(dto: RegisterRequest & { ipAddress?: string }) {
    const { email, username, displayName, password, referralCode } = dto

    const [emailTaken, usernameTaken] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.user.findUnique({ where: { username } }),
    ])

    if (emailTaken) throw new ConflictException("Email already registered")
    if (usernameTaken) throw new ConflictException("Username taken")

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          username,
          displayName,
          passwordHash,
          subscription: { create: { tier: "FREE" } },
        },
      })

      if (referralCode) {
        const referral = await tx.referral.findFirst({
          where: { code: referralCode, referredId: undefined },
        })
        if (referral) {
          await tx.referral.update({
            where: { id: referral.id },
            data: { referredId: newUser.id },
          })
        }
      }

      return newUser
    })

    await this.sendVerificationEmail(user.email, user.id)
    const tokens = await this.generateTokens(user.id, user.email)
    await this.saveRefreshToken(user.id, tokens.refreshToken, dto.ipAddress)

    return { user: this.users.sanitize(user), tokens }
  }

  async login(dto: LoginRequest & { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    if (!user || !user.passwordHash) throw new UnauthorizedException("Invalid credentials")
    if (user.isBanned) throw new ForbiddenException("Account suspended")

    const valid = await argon2.verify(user.passwordHash, dto.password)
    if (!valid) throw new UnauthorizedException("Invalid credentials")

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })

    const tokens = await this.generateTokens(user.id, user.email)
    await this.saveRefreshToken(user.id, tokens.refreshToken, dto.ipAddress, dto.userAgent)

    return { user: this.users.sanitize(user), tokens }
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, token: refreshToken, revokedAt: null },
    })

    if (!stored || new Date() > stored.expiresAt) {
      throw new UnauthorizedException("Refresh token invalid or expired")
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.isBanned) throw new UnauthorizedException()

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const tokens = await this.generateTokens(userId, user.email)
    await this.saveRefreshToken(userId, tokens.refreshToken)
    return tokens
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, token: refreshToken },
      data: { revokedAt: new Date() },
    })
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async oauthLogin(
    provider: "google" | "apple" | "tiktok",
    oauthId: string,
    profile: { email: string; displayName: string; avatarUrl?: string }
  ) {
    const field = `${provider}Id` as "googleId" | "appleId" | "tiktokId"

    let user = await this.prisma.user.findFirst({ where: { [field]: oauthId } })

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email: profile.email } })

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { [field]: oauthId, avatarUrl: user.avatarUrl ?? profile.avatarUrl },
        })
      } else {
        const username = await this.generateUsername(profile.displayName)
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: profile.email,
              username,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
              [field]: oauthId,
              isVerified: true,
              emailVerifiedAt: new Date(),
              subscription: { create: { tier: "FREE" } },
            },
          })
          return newUser
        })
      }
    }

    if (user.isBanned) throw new ForbiddenException("Account suspended")

    const tokens = await this.generateTokens(user.id, user.email)
    await this.saveRefreshToken(user.id, tokens.refreshToken)

    return { user: this.users.sanitize(user), tokens, isNew: !user.onboardingCompleted }
  }

  async verifyEmail(userId: string, token: string): Promise<void> {
    const stored = await this.redis.get(`email-verify:${userId}`)
    if (stored !== token) throw new BadRequestException("Invalid or expired verification link")

    await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    })

    await this.redis.del(`email-verify:${userId}`)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return // Silent — don't reveal if email exists

    const token = nanoid(48)
    await this.redis.set(`pwd-reset:${token}`, user.id, 3600)

    this.logger.log(`Password reset requested for ${email}`)
    // TODO: send email via Resend
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`pwd-reset:${token}`)
    if (!userId) throw new BadRequestException("Invalid or expired reset link")

    const hash = await argon2.hash(newPassword, { type: argon2.argon2id })
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })
    await this.redis.del(`pwd-reset:${token}`)
    await this.logoutAll(userId)
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { sub: userId, email }
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get("auth.jwtSecret"),
        expiresIn: this.config.get("auth.jwtExpiresIn", "15m"),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get("auth.jwtRefreshSecret"),
        expiresIn: this.config.get("auth.jwtRefreshExpiresIn", "7d"),
      }),
    ])

    return { accessToken, refreshToken, expiresIn: 900 }
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await this.prisma.refreshToken.create({
      data: { userId, token, ipAddress, userAgent, expiresAt },
    })
  }

  private async sendVerificationEmail(email: string, userId: string): Promise<void> {
    const token = nanoid(48)
    await this.redis.set(`email-verify:${userId}`, token, 86400)
    this.logger.log(`Verification email queued for ${email}`)
    // TODO: send via Resend
  }

  private async generateUsername(displayName: string): Promise<string> {
    const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "user"
    let username = base
    let i = 0
    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${base}${Math.floor(Math.random() * 9999)}`
      if (++i > 10) username = `user_${nanoid(8)}`
    }
    return username
  }
}
