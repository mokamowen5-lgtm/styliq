import { Controller, Get } from "@nestjs/common"
import { ApiTags, ApiOperation } from "@nestjs/swagger"
import { Public } from "../auth/decorators/public.decorator"
import { PrismaService } from "./prisma.service"
import { RedisService } from "./redis.service"

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Healthcheck — for load balancers & monitoring" })
  async check() {
    const checks = {
      api: "ok" as const,
      db: "unknown" as "ok" | "error" | "unknown",
      redis: "unknown" as "ok" | "error" | "unknown",
    }

    try {
      await this.prisma.$queryRaw`SELECT 1`
      checks.db = "ok"
    } catch {
      checks.db = "error"
    }

    try {
      await this.redis.client.ping()
      checks.redis = "ok"
    } catch {
      checks.redis = "error"
    }

    const allOk = Object.values(checks).every((v) => v === "ok")
    return {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "1.0.0",
      env: process.env.NODE_ENV ?? "development",
      checks,
    }
  }
}
