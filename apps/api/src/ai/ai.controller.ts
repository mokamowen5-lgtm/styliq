import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { AiService } from "./ai.service"
import type { Request } from "express"
import type { GenerateOutfitRequest, VirtualTryOnRequest, BrandDesignRequest } from "@stylesnap/types"

@ApiTags("ai")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: "ai", version: "1" })
export class AiController {
  constructor(private ai: AiService) {}

  @Post("generate/outfit")
  @Throttle({ medium: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Generate an AI outfit" })
  generateOutfit(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: GenerateOutfitRequest
  ) {
    return this.ai.generateOutfit(req.user.sub, dto)
  }

  @Post("generate/tryon")
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Virtual try-on (Premium+)" })
  virtualTryOn(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: VirtualTryOnRequest
  ) {
    return this.ai.virtualTryOn(req.user.sub, dto)
  }

  @Post("generate/brand")
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Generate brand design (VIP)" })
  generateBrand(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: BrandDesignRequest
  ) {
    return this.ai.generateBrandDesign(req.user.sub, dto)
  }

  @Get("generations")
  @ApiOperation({ summary: "Get user's generation history" })
  getGenerations(
    @Req() req: Request & { user: { sub: string } },
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.ai.getUserGenerations(req.user.sub, page, limit)
  }

  @Get("generations/:id")
  @ApiOperation({ summary: "Get a specific generation" })
  getGeneration(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string
  ) {
    return this.ai.getGeneration(id, req.user.sub)
  }

  @Get("recommendations")
  @ApiOperation({ summary: "Get personalized style recommendations" })
  getRecommendations(@Req() req: Request & { user: { sub: string } }) {
    return this.ai.getRecommendations(req.user.sub)
  }

  @Get("trends")
  @ApiOperation({ summary: "Get current style trends" })
  getTrends() {
    return this.ai.getTrends()
  }
}
