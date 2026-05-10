import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Ip,
  Headers,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import { AuthService } from "./auth.service"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard"
import { GoogleAuthGuard } from "./guards/google-auth.guard"
import { RegisterDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from "./dto"
import type { Request } from "express"

@ApiTags("auth")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post("register")
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new account" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "Email or username already taken" })
  register(@Body() dto: RegisterDto, @Ip() ipAddress: string) {
    return this.auth.register({ ...dto, ipAddress })
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Login with email & password" })
  login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string
  ) {
    return this.auth.login({ ...dto, ipAddress, userAgent })
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: "Refresh access token" })
  refresh(@Req() req: Request & { user: { sub: string; refreshToken: string } }) {
    return this.auth.refreshTokens(req.user.sub, req.user.refreshToken)
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout (revoke refresh token)" })
  logout(
    @Req() req: Request & { user: { sub: string }; body: { refreshToken: string } }
  ) {
    return this.auth.logout(req.user.sub, req.body.refreshToken)
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout from all devices" })
  logoutAll(@Req() req: Request & { user: { sub: string } }) {
    return this.auth.logoutAll(req.user.sub)
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Initiate Google OAuth" })
  googleAuth() {}

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Google OAuth callback" })
  googleCallback(@Req() req: Request & { user: any }) {
    return this.auth.oauthLogin("google", req.user.googleId, {
      email: req.user.email,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
    })
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Verify email address" })
  verifyEmail(
    @Req() req: Request & { user: { sub: string } },
    @Query("token") token: string
  ) {
    return this.auth.verifyEmail(req.user.sub, token)
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: "Request password reset email" })
  forgotPassword(@Body("email") email: string) {
    return this.auth.requestPasswordReset(email)
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password)
  }
}
