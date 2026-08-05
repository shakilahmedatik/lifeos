import { betterAuth } from "better-auth";
import type Database from "better-sqlite3";
import type { AppConfig } from "../../config.js";

// Export type alias for better-auth instance
export type AuthInstance = ReturnType<typeof betterAuth>;

export function createAuth(db: Database.Database, config: AppConfig): AuthInstance {
  return betterAuth({
    database: {
      db,
      provider: "sqlite",
    },
    secret: config.betterAuthSecret,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    trustedOrigins: config.allowedOrigins,
    user: {
      additionalFields: {
        pin: {
          type: "string",
          required: false,
        },
      },
    },
  }) as unknown as AuthInstance;
}
