import { betterAuth } from "better-auth";
const auth = betterAuth({
  database: { type: "sqlite", db: ":memory:" },
  advanced: { returnSessionToken: true }
});
console.log(auth.options.advanced);
