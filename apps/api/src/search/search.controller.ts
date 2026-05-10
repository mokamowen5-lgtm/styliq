import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Public } from "../auth/decorators/public.decorator"
import { SearchService } from "./search.service"
import type { Request } from "express"

@ApiTags("search")
@Controller({ path: "search", version: "1" })
export class SearchController {
  constructor(private search: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Universal search across outfits, users, hashtags, boards" })
  universalSearch(
    @Req() req: Request & { user?: { sub: string } },
    @Query("q") q: string,
    @Query("limit") limit = 8
  ) {
    return this.search.universalSearch(q, req.user?.sub, Number(limit))
  }

  @Get("autocomplete")
  @Public()
  @ApiOperation({ summary: "Autocomplete suggestions" })
  autocomplete(@Query("q") q = "", @Query("limit") limit = 8) {
    return this.search.autocomplete(q, Number(limit))
  }

  @Post("visual")
  @ApiOperation({ summary: "Visual search by image (uploaded URL)" })
  visualSearch(@Body() body: { imageUrl: string; limit?: number }) {
    return this.search.visualSearch(body.imageUrl, body.limit ?? 24)
  }

  @Get("history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's recent searches" })
  history(@Req() req: Request & { user: { sub: string } }) {
    return this.search.getRecentSearches(req.user.sub)
  }

  @Delete("history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Clear search history" })
  clearHistory(@Req() req: Request & { user: { sub: string } }) {
    return this.search.clearHistory(req.user.sub)
  }
}
