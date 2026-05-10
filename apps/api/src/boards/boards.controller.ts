import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Public } from "../auth/decorators/public.decorator"
import { BoardsService } from "./boards.service"
import type { Request } from "express"
import type { BoardCategory, BoardVisibility } from "@prisma/client"

@ApiTags("boards")
@Controller({ path: "boards", version: "1" })
export class BoardsController {
  constructor(private boards: BoardsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "List public boards (or by owner)" })
  list(
    @Req() req: Request & { user?: { sub: string } },
    @Query("ownerId") ownerId?: string,
    @Query("category") category?: BoardCategory,
    @Query("visibility") visibility?: BoardVisibility,
    @Query("page") page = 1,
    @Query("limit") limit = 24
  ) {
    return this.boards.list({
      userId: req.user?.sub,
      ownerId,
      category,
      visibility,
      page: Number(page),
      limit: Number(limit),
    })
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get a board by ID" })
  findOne(
    @Req() req: Request & { user?: { sub: string } },
    @Param("id") id: string
  ) {
    return this.boards.findOne(id, req.user?.sub)
  }

  @Get(":id/items")
  @Public()
  @ApiOperation({ summary: "Get items inside a board (with pagination)" })
  getItems(
    @Req() req: Request & { user?: { sub: string } },
    @Param("id") id: string,
    @Query("page") page = 1,
    @Query("limit") limit = 24
  ) {
    return this.boards.getItems(id, req.user?.sub, Number(page), Number(limit))
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new board" })
  create(@Req() req: Request & { user: { sub: string } }, @Body() body: any) {
    return this.boards.create(req.user.sub, body)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update board metadata" })
  update(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string,
    @Body() body: any
  ) {
    return this.boards.update(id, req.user.sub, body)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a board (owner only)" })
  delete(@Req() req: Request & { user: { sub: string } }, @Param("id") id: string) {
    return this.boards.delete(id, req.user.sub)
  }

  // ─── Items ─────────────────────────────────────────────────

  @Post(":id/items")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add an outfit to a board" })
  addItem(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") boardId: string,
    @Body() body: { outfitId: string; note?: string }
  ) {
    return this.boards.addItem(boardId, req.user.sub, body.outfitId, body.note)
  }

  @Delete(":id/items/:outfitId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove an outfit from a board" })
  removeItem(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") boardId: string,
    @Param("outfitId") outfitId: string
  ) {
    return this.boards.removeItem(boardId, req.user.sub, outfitId)
  }

  @Post(":id/reorder")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder items via drag & drop" })
  reorder(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") boardId: string,
    @Body() body: { itemIds: string[] }
  ) {
    return this.boards.reorderItems(boardId, req.user.sub, body.itemIds)
  }

  // ─── Collaborators ─────────────────────────────────────────

  @Post(":id/collaborators")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Invite a collaborator" })
  invite(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") boardId: string,
    @Body() body: { userId: string; canEdit?: boolean }
  ) {
    return this.boards.invite(boardId, req.user.sub, body.userId, body.canEdit ?? true)
  }

  @Post(":id/collaborators/accept")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Accept a collaboration invite" })
  acceptInvite(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") boardId: string
  ) {
    return this.boards.acceptInvite(boardId, req.user.sub)
  }

  @Delete(":id/collaborators/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove a collaborator (owner only)" })
  removeCollab(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") boardId: string,
    @Param("userId") userId: string
  ) {
    return this.boards.removeCollaborator(boardId, req.user.sub, userId)
  }
}
