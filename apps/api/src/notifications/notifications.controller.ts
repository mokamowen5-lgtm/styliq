import {
  Controller, Get, Post, Delete, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { NotificationsService } from "./notifications.service"
import type { Request } from "express"

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private notif: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List notifications" })
  list(
    @Req() req: Request & { user: { sub: string } },
    @Query("page") page = 1,
    @Query("limit") limit = 30
  ) {
    return this.notif.list(req.user.sub, Number(page), Number(limit))
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  unreadCount(@Req() req: Request & { user: { sub: string } }) {
    return this.notif.getUnreadCount(req.user.sub)
  }

  @Post(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark a notification as read" })
  markRead(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string
  ) {
    return this.notif.markAsRead(req.user.sub, id)
  }

  @Post("read-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAllRead(@Req() req: Request & { user: { sub: string } }) {
    return this.notif.markAllAsRead(req.user.sub)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a notification" })
  delete(
    @Req() req: Request & { user: { sub: string } },
    @Param("id") id: string
  ) {
    return this.notif.delete(req.user.sub, id)
  }
}
