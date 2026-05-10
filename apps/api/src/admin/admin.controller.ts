import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { AdminService } from "./admin.service"

@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
@Controller({ path: "admin", version: "1" })
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get("stats")
  @ApiOperation({ summary: "Global platform stats" })
  stats() {
    return this.admin.getStats()
  }

  @Get("activity/generations")
  @ApiOperation({ summary: "Generation activity over time" })
  generationActivity(@Query("days") days = 7) {
    return this.admin.getGenerationActivity(Number(days))
  }

  @Get("users")
  @ApiOperation({ summary: "List & search users" })
  listUsers(
    @Query("page") page = 1,
    @Query("limit") limit = 30,
    @Query("sort") sort?: string,
    @Query("search") search?: string,
    @Query("role") role?: string,
    @Query("tier") tier?: string
  ) {
    return this.admin.listUsers({
      page: Number(page),
      limit: Number(limit),
      sort,
      search,
      role,
      tier,
    })
  }

  @Post("users/:id/ban")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ban a user" })
  banUser(@Param("id") id: string, @Body() body: { reason: string }) {
    return this.admin.banUser(id, body.reason)
  }

  @Post("users/:id/unban")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Unban a user" })
  unbanUser(@Param("id") id: string) {
    return this.admin.unbanUser(id)
  }

  @Get("reports")
  @ApiOperation({ summary: "List reports" })
  listReports(
    @Query("page") page = 1,
    @Query("limit") limit = 30,
    @Query("resolved") resolved?: string
  ) {
    return this.admin.listReports({
      page: Number(page),
      limit: Number(limit),
      resolved: resolved === "true" ? true : resolved === "false" ? false : undefined,
    })
  }

  @Post("reports/:id/resolve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resolve a report" })
  resolveReport(
    @Param("id") id: string,
    @Body() body: { action: "dismiss" | "remove_content" | "ban_user"; note?: string }
  ) {
    return this.admin.resolveReport(id, body.action, body.note)
  }
}
