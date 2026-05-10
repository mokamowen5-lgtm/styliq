import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Redis from "ioredis"

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis
  private readonly logger = new Logger(RedisService.name)

  constructor(config: ConfigService) {
    this.client = new Redis(config.get<string>("app.redisUrl", "redis://localhost:6379"), {
      retryStrategy: (times) => Math.min(times * 100, 2000),
      lazyConnect: false,
    })

    this.client.on("connect", () => this.logger.log("Redis connected"))
    this.client.on("error", (err) => this.logger.error("Redis error", err))
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(...keys: string[]): Promise<void> {
    await this.client.del(...keys)
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)
    return value ? (JSON.parse(value) as T) : null
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds)
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) await this.client.del(...keys)
  }

  onModuleDestroy() {
    this.client.disconnect()
  }
}
