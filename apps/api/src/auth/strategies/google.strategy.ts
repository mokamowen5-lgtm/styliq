import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, Profile } from "passport-google-oauth20"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("auth.googleClientId", ""),
      clientSecret: config.get<string>("auth.googleClientSecret", ""),
      callbackURL: `${config.get("app.url")}/api/v1/auth/google/callback`,
      scope: ["email", "profile"],
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user: unknown) => void
  ) {
    const { id, emails, displayName, photos } = profile
    done(null, {
      googleId: id,
      email: emails?.[0]?.value,
      displayName,
      avatarUrl: photos?.[0]?.value,
    })
  }
}
