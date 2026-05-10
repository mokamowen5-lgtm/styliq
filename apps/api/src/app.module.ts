import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ThrottlerModule } from "@nestjs/throttler"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { ScheduleModule } from "@nestjs/schedule"
import { BullModule } from "@nestjs/bull"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { AiModule } from "./ai/ai.module"
import { OutfitsModule } from "./outfits/outfits.module"
import { ProductsModule } from "./products/products.module"
import { OrdersModule } from "./orders/orders.module"
import { SubscriptionsModule } from "./subscriptions/subscriptions.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { AdminModule } from "./admin/admin.module"
import { BoardsModule } from "./boards/boards.module"
import { HashtagsModule } from "./hashtags/hashtags.module"
import { RecommendationModule } from "./recommendation/recommendation.module"
import { SearchModule } from "./search/search.module"
import { AestheticModule } from "./aesthetic/aesthetic.module"
import { CommonModule } from "./common/common.module"
import { appConfig, authConfig, aiConfig, storageConfig, stripeConfig } from "./config"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, aiConfig, storageConfig, stripeConfig],
      envFilePath: [".env.local", ".env"],
    }),

    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 10 },
      { name: "medium", ttl: 10000, limit: 50 },
      { name: "long", ttl: 60000, limit: 200 },
    ]),

    BullModule.forRootAsync({
      useFactory: () => ({
        redis: { host: process.env.REDIS_HOST ?? "localhost", port: 6379 },
        defaultJobOptions: { removeOnComplete: 100, removeOnFail: 50 },
      }),
    }),

    EventEmitterModule.forRoot({ wildcard: true }),
    ScheduleModule.forRoot(),

    CommonModule,
    AuthModule,
    UsersModule,
    AiModule,
    OutfitsModule,
    BoardsModule,
    HashtagsModule,
    RecommendationModule,
    SearchModule,
    AestheticModule,
    ProductsModule,
    OrdersModule,
    SubscriptionsModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
