import { Processor, Process } from "@nestjs/bull"
import type { Job } from "bull"
import { Logger } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { AiService } from "./ai.service"

@Processor("ai-generation")
export class AiGenerationProcessor {
  private readonly logger = new Logger(AiGenerationProcessor.name)

  constructor(
    private ai: AiService,
    private events: EventEmitter2
  ) {}

  @Process("outfit")
  async handleOutfitGeneration(job: Job<{ generationId: string; userId: string; dto: any }>) {
    const { generationId, userId, dto } = job.data
    this.logger.log(`Processing outfit generation ${generationId}`)

    const result = await this.ai.processOutfitGeneration(generationId, userId, dto)
    this.events.emit("generation.completed", { userId, generationId, result })

    return result
  }

  @Process("tryon")
  async handleTryOn(job: Job<{ generationId: string; userId: string; dto: any }>) {
    const { generationId, userId, dto } = job.data
    this.logger.log(`Processing try-on generation ${generationId}`)

    const result = await this.ai.processTryOn(generationId, userId, dto)
    this.events.emit("generation.completed", { userId, generationId, result })

    return result
  }
}
