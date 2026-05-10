import { Module } from "@nestjs/common"
import { AestheticController } from "./aesthetic.controller"
import { AestheticService } from "./aesthetic.service"

@Module({
  controllers: [AestheticController],
  providers: [AestheticService],
  exports: [AestheticService],
})
export class AestheticModule {}
