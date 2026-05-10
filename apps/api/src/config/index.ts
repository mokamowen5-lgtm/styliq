import { registerAs } from "@nestjs/config"

export const appConfig = registerAs("app", () => ({
  env: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  url: process.env.API_URL ?? "http://localhost:4000",
  frontendUrl: process.env.APP_URL ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
}))

export const authConfig = registerAs("auth", () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  appleClientId: process.env.APPLE_CLIENT_ID,
}))

export const aiConfig = registerAs("ai", () => ({
  openaiApiKey: process.env.OPENAI_API_KEY,
  replicateToken: process.env.REPLICATE_API_TOKEN,
  stabilityApiKey: process.env.STABILITY_API_KEY,
  fashnApiKey: process.env.FASHN_API_KEY,
  removebgApiKey: process.env.REMOVEBG_API_KEY,
}))

export const storageConfig = registerAs("storage", () => ({
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION ?? "eu-west-1",
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "stylesnap-media",
  cdnUrl: process.env.AWS_CLOUDFRONT_URL ?? "",
}))

export const stripeConfig = registerAs("stripe", () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  premiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  vipPriceId: process.env.STRIPE_VIP_PRICE_ID,
}))
