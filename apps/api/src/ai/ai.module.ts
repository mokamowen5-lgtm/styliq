import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bull"
import { AiController } from "./ai.controller"
import { AiService } from "./ai.service"
import { AiGenerationProcessor } from "./ai-generation.processor"

@Module({
  imports: [
    BullModule.registerQueue({ name: "ai-generation" }),
  ],
  controllers: [AiController],
  providers: [AiService, AiGenerationProcessor],
  exports: [AiService],
})
export class AiModule {}
