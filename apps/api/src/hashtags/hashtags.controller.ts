import { Controller, Get, Param, Query } from "@nestjs/common"
import { ApiTags, ApiOperation } from "@nestjs/swagger"
import { Public } from "../auth/decorators/public.decorator"
import { HashtagsService } from "./hashtags.service"

@ApiTags("hashtags")
@Controller({ path: "hashtags", version: "1" })
export class HashtagsController {
  constructor(private hashtags: HashtagsService) {}

  @Get("trending")
  @Public()
  @ApiOperation({ summary: "Top trending hashtags right now" })
  trending(@Query("limit") limit = 20) {
    return this.hashtags.getTrending(Number(limit))
  }

  @Get("search")
  @Public()
  @ApiOperation({ summary: "Autocomplete hashtags" })
  search(@Query("q") q: string, @Query("limit") limit = 10) {
    return this.hashtags.search(q, Number(limit))
  }

  @Get(":tag")
  @Public()
  @ApiOperation({ summary: "Get hashtag detail" })
  getOne(@Param("tag") tag: string) {
    return this.hashtags.findOne(tag)
  }

  @Get(":tag/outfits")
  @Public()
  @ApiOperation({ summary: "Get outfits for a hashtag" })
  getOutfits(
    @Param("tag") tag: string,
    @Query("page") page = 1,
    @Query("limit") limit = 24
  ) {
    return this.hashtags.getOutfitsForHashtag(tag, Number(page), Number(limit))
  }
}
