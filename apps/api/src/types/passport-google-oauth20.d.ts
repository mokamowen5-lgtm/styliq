declare module "passport-google-oauth20" {
  import { Strategy as PassportStrategy } from "passport"

  export interface Profile {
    id: string
    displayName: string
    name?: { familyName?: string; givenName?: string }
    emails?: Array<{ value: string; verified?: boolean }>
    photos?: Array<{ value: string }>
    provider: string
    _raw: string
    _json: unknown
  }

  export interface StrategyOptions {
    clientID: string
    clientSecret: string
    callbackURL: string
    scope?: string | string[]
    passReqToCallback?: boolean
  }

  type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void
  ) => void

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyCallback)
  }
}
