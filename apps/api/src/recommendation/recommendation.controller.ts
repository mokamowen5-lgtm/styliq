import { Controller, Get, Post, Body, Query, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RecommendationService } from "./recommendation.service"
import type { Request } from "express"
import type { FeedType, WatchEventType } from "@prisma/client"

@ApiTags("recommendation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: "recommendation", version: "1" })
export class RecommendationController {
  constructor(private reco: RecommendationService) {}

  @Get("feed")
  @ApiOperation({ summary: "Get personalized ranked feed" })
  async getFeed(
    @Req() req: Request & { user: { sub: string } },
    @Query("type") type: FeedType = "FOR_YOU",
    @Query("limit") limit = 30
  ) {
    return this.reco.getRankedFeed(req.user.sub, type, Number(limit))
  }

  @Post("track")
  @ApiOperation({ summary: "Track a watch event (for recommendation training)" })
  trackEvent(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: {
      outfitId: string
      eventType: WatchEventType
      durationMs?: number
      feedType?: FeedType
      position?: number
      sessionId?: string
    }
  ) {
    return this.reco.trackEvent(req.user.sub, body.outfitId, body.eventType, {
      durationMs: body.durationMs,
      feedType: body.feedType,
      position: body.position,
      sessionId: body.sessionId,
    })
  }

  @Post("recompute-my-embedding")
  @ApiOperation({ summary: "Manually trigger embedding recomputation" })
  recompute(@Req() req: Request & { user: { sub: string } }) {
    return this.reco.computeUserEmbedding(req.user.sub)
  }
}
