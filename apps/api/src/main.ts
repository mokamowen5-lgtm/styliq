import { NestFactory } from "@nestjs/core"
import { ValidationPipe, VersioningType } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { ConfigService } from "@nestjs/config"
import helmet from "helmet"
import compression from "compression"
import { json, urlencoded, static as expressStatic } from "express"
import path from "path"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger:
      process.env.NODE_ENV === "production"
        ? ["error", "warn", "log"]
        : ["error", "warn", "log", "debug"],
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.APP_URL,
          process.env.FRONTEND_URL,
          "http://localhost:3000",
          "http://localhost:8081",
          /\.styliq\.ai$/,
          /\.vercel\.app$/,    // Vercel preview deployments
          /\.expo\.dev$/,      // Expo Go shareable URLs
        ].filter(Boolean) as (string | RegExp)[]

        if (!origin || allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin))) {
          callback(null, true)
        } else {
          callback(new Error(`CORS not allowed: ${origin}`))
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  })

  const configService = app.get(ConfigService)

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
  app.use(compression())

  // Allow large JSON bodies (data-URI photo uploads can be 2-5 MB)
  app.use(json({ limit: "20mb" }))
  app.use(urlencoded({ extended: true, limit: "20mb" }))

  // Serve local uploads directory (used as S3 fallback in dev)
  app.use("/uploads", expressStatic(path.join(process.cwd(), "uploads")))

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  )

  // API versioning
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" })
  app.setGlobalPrefix("api")

  // Swagger docs (dev only — never expose in prod)
  if (configService.get("NODE_ENV") !== "production") {
    const config = new DocumentBuilder()
      .setTitle("STYLIQ API")
      .setDescription("Fashion AI platform REST API")
      .setVersion("1.0")
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    })
  }

  const port = configService.get<number>("PORT", 4000)
  await app.listen(port, "0.0.0.0")  // 0.0.0.0 required by Railway/Render

  console.log(`🚀 STYLIQ API running on port ${port}`)
  if (process.env.NODE_ENV !== "production") {
    console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`)
  }
}

bootstrap()
