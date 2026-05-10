import { Module } from "@nestjs/common"
import { SearchController } from "./search.controller"
import { SearchService } from "./search.service"
import { HashtagsModule } from "../hashtags/hashtags.module"

@Module({
  imports: [HashtagsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
