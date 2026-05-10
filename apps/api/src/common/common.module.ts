import { Global, Module } from "@nestjs/common"
import { PrismaService } from "./prisma.service"
import { StorageService } from "./storage.service"
import { RedisService } from "./redis.service"
import { HealthController } from "./health.controller"

@Global()
@Module({
  controllers: [HealthController],
  providers: [PrismaService, StorageService, RedisService],
  exports: [PrismaService, StorageService, RedisService],
})
export class CommonModule {}
