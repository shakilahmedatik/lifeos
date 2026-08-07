import type { Client } from "@libsql/client";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import type { AppConfig } from "../../config.js";

// Export type alias for better-auth instance
export type AuthInstance = ReturnType<typeof betterAuth>;

export function createAuth(client: Client, config: AppConfig): AuthInstance {
  const kysely = new Kysely({
    dialect: new LibsqlDialect({
      client: client as unknown as Extract<
        ConstructorParameters<typeof LibsqlDialect>[0],
        { client: unknown }
      >["client"],
    }),
  });

  return betterAuth({
    database: {
      db: kysely,
      type: "sqlite",
    },
    baseURL: config.baseURL,
    secret: config.betterAuthSecret,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    trustedOrigins: config.allowedOrigins,
    advanced: {
      defaultBearerTokenHeaderName: "Authorization",
      useSecureCookies: process.env.NODE_ENV === "production",
      returnSessionToken: true,
    },
  }) as unknown as AuthInstance;
}
