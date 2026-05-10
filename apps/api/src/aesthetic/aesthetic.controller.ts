import { Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Public } from "../auth/decorators/public.decorator"
import { AestheticService } from "./aesthetic.service"
import { PrismaService } from "../common/prisma.service"
import type { Request } from "express"

@ApiTags("aesthetic")
@Controller({ path: "aesthetic", version: "1" })
export class AestheticController {
  constructor(
    private aesthetic: AestheticService,
    private prisma: PrismaService
  ) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my aesthetic profile" })
  myProfile(@Req() req: Request & { user: { sub: string } }) {
    return this.aesthetic.getProfile(req.user.sub)
  }

  @Get("user/:username")
  @Public()
  @ApiOperation({ summary: "Get a user's public aesthetic profile" })
  async byUsername(@Param("username") username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })
    if (!user) return null
    return this.aesthetic.getProfile(user.id)
  }

  @Post("recompute")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Force recompute of my aesthetic profile" })
  recompute(@Req() req: Request & { user: { sub: string } }) {
    return this.aesthetic.computeProfile(req.user.sub)
  }
}
