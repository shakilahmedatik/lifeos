import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import type { AppConfig } from "../../config.js";
import type { DrizzleClient } from "../../shared/db.js";
import * as schema from "../../shared/schema.js";

// Export type alias for better-auth instance
export type AuthInstance = ReturnType<typeof betterAuth>;

export function createAuth(db: DrizzleClient, config: AppConfig): AuthInstance {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    baseURL: config.baseURL,
    secret: config.betterAuthSecret,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    plugins: [bearer()],
    trustedOrigins: config.allowedOrigins,
    advanced: {
      defaultBearerTokenHeaderName: "Authorization",
      useSecureCookies: process.env.NODE_ENV === "production",
      returnSessionToken: true,
    },
  }) as unknown as AuthInstance;
}
