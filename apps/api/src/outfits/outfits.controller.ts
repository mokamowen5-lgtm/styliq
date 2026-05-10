import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { OutfitsService } from "./outfits.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Public } from "../auth/decorators/public.decorator"
import type { Request } from "express"

@ApiTags("outfits")
@Controller({ path: "outfits", version: "1" })
export class OutfitsController {
  constructor(private outfits: OutfitsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Get social feed" })
  feed(
    @Req() req: Request & { user?: { sub: string } },
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: number,
    @Query("trending") trending?: string,
    @Query("following") following?: string,
    @Query("style") style?: string
  ) {
    return this.outfits.getFeed({
      userId: req.user?.sub,
      cursor,
      limit: limit ? Number(limit) : 24,
      trending: trending === "true",
      following: following === "true",
      style,
    })
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get outfit by ID" })
  findOne(
    @Req() req: Request & { user?: { sub: string } },
    @Param("id") id: string
  ) {
    return this.outfits.findById(id, req.user?.sub)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create outfit post" })
  create(@Req() req: Request & { user: { sub: string } }, @Body() body: any) {
    return this.outfits.create(req.user.sub, body)
  }

  @Post(":id/like")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Like / unlike outfit" })
  like(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.outfits.toggleLike(req.user.sub, id)
  }

  @Post(":id/save")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save / unsave outfit" })
  save(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.outfits.toggleSave(req.user.sub, id)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete outfit" })
  delete(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.outfits.delete(req.user.sub, id)
  }

  // ─── Comments ──────────────────────────────────────────────

  @Get(":id/comments")
  @Public()
  @ApiOperation({ summary: "List comments on an outfit" })
  getComments(
    @Param("id") id: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ) {
    return this.outfits.getComments(id, Number(page), Number(limit))
  }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add a comment" })
  addComment(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string,
    @Body() body: { content: string; parentId?: string }
  ) {
    return this.outfits.addComment(req.user.sub, id, body.content, body.parentId)
  }

  @Delete("comments/:commentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a comment (own only)" })
  deleteComment(
    @Req() req: Request & { user: { sub: string } },
    @Param("commentId") commentId: string
  ) {
    return this.outfits.deleteComment(req.user.sub, commentId)
  }
}
