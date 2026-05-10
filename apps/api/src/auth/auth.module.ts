import { Module, Logger, type Provider } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { ConfigService } from "@nestjs/config"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy"
import { GoogleStrategy } from "./strategies/google.strategy"
import { UsersModule } from "../users/users.module"

const logger = new Logger("AuthModule")

/**
 * Google OAuth provider — only registered if GOOGLE_CLIENT_ID is configured.
 * Otherwise the GoogleStrategy constructor would crash on startup.
 */
const googleStrategyProvider: Provider = {
  provide: GoogleStrategy,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const clientId = config.get<string>("auth.googleClientId")
    if (!clientId) {
      logger.warn("GOOGLE_CLIENT_ID not configured — Google OAuth disabled")
      return null
    }
    return new GoogleStrategy(config)
  },
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("auth.jwtSecret"),
        signOptions: { expiresIn: config.get<string>("auth.jwtExpiresIn", "15m") },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, googleStrategyProvider],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
