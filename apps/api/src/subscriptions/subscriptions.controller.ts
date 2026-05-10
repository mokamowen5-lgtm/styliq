import {
  Controller, Get, Post, Body, Req,
  UseGuards, Headers, RawBodyRequest, HttpCode, HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Public } from "../auth/decorators/public.decorator"
import { SubscriptionsService } from "./subscriptions.service"
import type { Request } from "express"

@ApiTags("subscriptions")
@Controller({ path: "subscriptions", version: "1" })
export class SubscriptionsController {
  constructor(private subs: SubscriptionsService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's subscription" })
  getMine(@Req() req: Request & { user: { sub: string } }) {
    return this.subs.getMine(req.user.sub)
  }

  @Post("checkout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create Stripe Checkout session" })
  checkout(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: { tier: "PREMIUM" | "VIP" }
  ) {
    return this.subs.createCheckoutSession(req.user.sub, body.tier)
  }

  @Post("portal")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create Stripe Customer Portal session" })
  portal(@Req() req: Request & { user: { sub: string } }) {
    return this.subs.createPortalSession(req.user.sub)
  }

  @Post("webhook")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stripe webhook receiver" })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ) {
    return this.subs.handleWebhook(req.rawBody!, signature)
  }
}
