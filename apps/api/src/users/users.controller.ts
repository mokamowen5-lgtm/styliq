import {
  Controller, Get, Patch, Post, Body, Param,
  UseGuards, Req, HttpCode, HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { UsersService } from "./users.service"
import type { Request } from "express"

@ApiTags("users")
@Controller({ path: "users", version: "1" })
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user" })
  me(@Req() req: Request & { user: { sub: string } }) {
    return this.users.findById(req.user.sub)
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  updateProfile(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: any
  ) {
    return this.users.updateProfile(req.user.sub, body)
  }

  @Patch("me/onboarding")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Complete onboarding" })
  completeOnboarding(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: any
  ) {
    return this.users.completeOnboarding(req.user.sub, body)
  }

  @Get(":username")
  @ApiOperation({ summary: "Get user by username" })
  getProfile(@Param("username") username: string) {
    return this.users.findByUsername(username)
  }

  @Post(":userId/follow")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Follow / unfollow user" })
  follow(
    @Req() req: Request & { user: { sub: string } },
    @Param("userId") targetId: string
  ) {
    return this.users.followUser(req.user.sub, targetId)
  }
}
